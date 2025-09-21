/*
 * SmartAgro ESP32 Production Firmware
 * 
 * EXACT PIN CONFIGURATION (DO NOT CHANGE):
 * - Soil Moisture Sensor (Analog) → GPIO34 (ADC)
 * - DHT11 (Air Temp & Humidity) → GPIO4
 * - Relay Module (Pump Control) → GPIO14 (ACTIVE LOW)
 * - Rain Sensor (Analog) → GPIO32
 * - MQ135 Air Quality Sensor (Analog) → GPIO35
 * - LDR Sensor (Digital module) → GPIO15
 * - DS18B20 (Soil Temperature) → GPIO25 (1-wire, 4.7k pull-up to 3.3V)
 * 
 * Required Libraries:
 * - WiFi (built-in)
 * - HTTPClient (built-in)
 * - ArduinoJson (install from Library Manager)
 * - OneWire (install from Library Manager)
 * - DallasTemperature (install from Library Manager)
 * - DHT (install from Library Manager)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Function to get Unix timestamp in milliseconds
unsigned long getUnixTimestamp() {
  // Get current time from NTP server
  time_t now;
  struct tm timeinfo;
  
  if (!getLocalTime(&timeinfo)) {
    // If NTP time is not available, use a calculated timestamp
    // This creates a reasonable timestamp based on millis() and a base time
    static unsigned long baseTime = 0;
    if (baseTime == 0) {
      // Set base time to current Unix timestamp in MILLISECONDS
      baseTime = 1758394300000; // Current timestamp in milliseconds (updated)
    }
    unsigned long timestamp = baseTime + millis();
    Serial.print("🕐 Fallback timestamp (milliseconds): ");
    Serial.println(timestamp);
    return timestamp;
  }
  
  time(&now);
  unsigned long timestamp = (unsigned long)now * 1000; // Convert to milliseconds
  Serial.print("🕐 NTP timestamp (milliseconds): ");
  Serial.println(timestamp);
  return timestamp;
}

// ============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

// WiFi Configuration
const char* WIFI_SSID = "THAVANAYAGAM";
const char* WIFI_PASSWORD = "Thavam62";

// Firebase Configuration
const char* FIREBASE_HOST = "https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app";
const char* DEVICE_ID = "ESP32_001";

// ============================================================================
// EXACT PIN DEFINITIONS (DO NOT CHANGE)
// ============================================================================

#define SOIL_MOISTURE_PIN 34    // Analog pin for soil moisture
#define DHT_PIN 4              // Digital pin for DHT11
#define RELAY_PIN 14           // Digital pin for relay (ACTIVE LOW)
#define RAIN_PIN 32            // Analog pin for rain sensor
#define MQ135_PIN 35           // Analog pin for MQ135
#define LDR_PIN 15             // Digital pin for LDR
#define DS18B20_PIN 25         // Digital pin for DS18B20

// ============================================================================
// SENSOR CALIBRATION CONSTANTS
// ============================================================================

// Soil Moisture Calibration (from specifications)
const int SOIL_MOISTURE_DRY = 2910;
const int SOIL_MOISTURE_WET = 1465;

// ============================================================================
// SENSOR OBJECTS
// ============================================================================

DHT dht(DHT_PIN, DHT11);
OneWire oneWire(DS18B20_PIN);
DallasTemperature soilTempSensor(&oneWire);

// ============================================================================
// DATA STRUCTURES
// ============================================================================

struct SensorData {
  int soilMoistureRaw;
  int soilMoisturePct;
  float airTemperature;
  float airHumidity;
  float soilTemperature;
  int airQualityIndex;
  struct {
    int co2;
    int nh3;
  } gases;
  int lightDetected;
  int rainLevelRaw;
  String relayStatus;
  unsigned long timestamp;
};

struct ControlData {
  String relayStatus;
  String mode;
  String lastChangedBy;
  unsigned long timestamp;
};

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

SensorData currentData;
ControlData controlData;
struct tm timeinfo;
unsigned long lastDataSend = 0;
unsigned long lastControlCheck = 0;
unsigned long lastScheduleCheck = 0;
unsigned long lastRelayCheck = 0;
const unsigned long DATA_SEND_INTERVAL = 12000;    // 12 seconds
const unsigned long CONTROL_CHECK_INTERVAL = 3000;  // 3 seconds
const unsigned long SCHEDULE_CHECK_INTERVAL = 60000; // 1 minute
const unsigned long RELAY_CHECK_INTERVAL = 500;     // 0.5 seconds for instant response

// ============================================================================
// SETUP FUNCTION
// ============================================================================

void setup() {
  Serial.begin(115200);
  Serial.println("🌱 SmartAgro ESP32 Production Starting...");
  
  // Initialize pins
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Relay is active LOW, so start with pump OFF
  
  pinMode(LDR_PIN, INPUT);
  
  // Initialize sensors
  dht.begin();
  soilTempSensor.begin();
  
  // Connect to WiFi
  connectToWiFi();
  
  // Configure NTP time
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("🕐 Configuring NTP time...");
  
  // Wait for NTP time to be available
  int retry = 0;
  while (!getLocalTime(&timeinfo) && retry < 10) {
    Serial.print("⏳ Waiting for NTP time... ");
    Serial.println(retry + 1);
    delay(1000);
    retry++;
  }
  
  if (getLocalTime(&timeinfo)) {
    Serial.println("✅ NTP time configured successfully");
  } else {
    Serial.println("⚠️ NTP time not available, using millis() fallback");
  }
  
  // Initialize control data
  controlData.relayStatus = "off";
  controlData.mode = "manual";
  controlData.lastChangedBy = "system";
  controlData.timestamp = getUnixTimestamp();
  
  // Run self-test
  runSelfTest();
  
  Serial.println("✅ SmartAgro ESP32 Production Ready!");
  Serial.println("📡 Sending data to Firebase every 12 seconds");
  Serial.println("🎛️ Checking for control commands every 3 seconds");
  Serial.println("⏰ Checking schedules every minute");
}

// ============================================================================
// MAIN LOOP
// ============================================================================

void loop() {
  // Read all sensors
  readAllSensors();
  
  // Check smart irrigation logic
  checkSmartIrrigation();
  
  // Send data to Firebase every 12 seconds
  if (millis() - lastDataSend >= DATA_SEND_INTERVAL) {
    sendSensorDataToFirebase();
    lastDataSend = millis();
  }
  
  // Check for control commands every 3 seconds
  if (millis() - lastControlCheck >= CONTROL_CHECK_INTERVAL) {
    checkForControlCommands();
    lastControlCheck = millis();
  }
  
  // Check for instant relay control every 0.5 seconds
  if (millis() - lastRelayCheck >= RELAY_CHECK_INTERVAL) {
    checkInstantRelayControl();
    lastRelayCheck = millis();
  }
  
  // Check schedules every minute
  if (millis() - lastScheduleCheck >= SCHEDULE_CHECK_INTERVAL) {
    checkIrrigationSchedules();
    lastScheduleCheck = millis();
  }
  
  // Small delay to prevent overwhelming the system
  delay(100);
}

// ============================================================================
// WIFI CONNECTION
// ============================================================================

void connectToWiFi() {
  Serial.print("📶 Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ WiFi Connected!");
    Serial.print("📡 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("❌ WiFi Connection Failed!");
    Serial.println("🔄 Retrying in 10 seconds...");
    delay(10000);
    connectToWiFi();
  }
}

// ============================================================================
// SENSOR READING FUNCTIONS
// ============================================================================

void readAllSensors() {
  // Read DHT11 (Air Temperature & Humidity)
  currentData.airTemperature = dht.readTemperature();
  currentData.airHumidity = dht.readHumidity();
  
  // Read DS18B20 (Soil Temperature)
  soilTempSensor.requestTemperatures();
  currentData.soilTemperature = soilTempSensor.getTempCByIndex(0);
  
  // Read Soil Moisture (Analog) with calibration
  currentData.soilMoistureRaw = analogRead(SOIL_MOISTURE_PIN);
  // Convert to percentage using calibration values
  currentData.soilMoisturePct = map(currentData.soilMoistureRaw, SOIL_MOISTURE_DRY, SOIL_MOISTURE_WET, 0, 100);
  currentData.soilMoisturePct = constrain(currentData.soilMoisturePct, 0, 100);
  
  // Read MQ135 (Air Quality & Gas Levels)
  int airQualityRaw = analogRead(MQ135_PIN);
  currentData.airQualityIndex = airQualityRaw;
  
  // Calculate gas levels from MQ135 (simplified calculations)
  // Note: These are approximate values - real calibration would be needed
  currentData.gases.co2 = airQualityRaw * 0.8;  // Approximate CO2
  currentData.gases.nh3 = airQualityRaw * 0.3;  // Approximate NH3
  
  // Read Rain Sensor
  currentData.rainLevelRaw = analogRead(RAIN_PIN);
  
  // Read LDR (Light Detection - Digital)
  currentData.lightDetected = digitalRead(LDR_PIN);
  
  // Read Relay Status
  currentData.relayStatus = !digitalRead(RELAY_PIN) ? "on" : "off"; // Relay is active LOW
  
  // Update timestamp (Unix timestamp in milliseconds)
  currentData.timestamp = getUnixTimestamp();
  
  // Print sensor readings
  printSensorReadings();
  
  // Debug: Print timestamp info
  Serial.print("🕐 Timestamp: ");
  Serial.print(currentData.timestamp);
  Serial.print(" (millis: ");
  Serial.print(millis());
  Serial.println(")");
}

void printSensorReadings() {
  Serial.println("📊 Sensor Readings:");
  Serial.print("  🌡️ Air Temperature: ");
  Serial.print(currentData.airTemperature);
  Serial.println("°C");
  
  Serial.print("  💨 Air Humidity: ");
  Serial.print(currentData.airHumidity);
  Serial.println("%");
  
  Serial.print("  🌡️ Soil Temperature: ");
  Serial.print(currentData.soilTemperature);
  Serial.println("°C");
  
  Serial.print("  💧 Soil Moisture: ");
  Serial.print(currentData.soilMoisturePct);
  Serial.print("% (Raw: ");
  Serial.print(currentData.soilMoistureRaw);
  Serial.println(")");
  
  Serial.print("  ⚠️ Air Quality Index: ");
  Serial.println(currentData.airQualityIndex);
  
  Serial.print("  💨 Gas Levels - CO2: ");
  Serial.print(currentData.gases.co2);
  Serial.print(" ppm, NH3: ");
  Serial.print(currentData.gases.nh3);
  Serial.println(" ppm");
  
  Serial.print("  🌧️ Rain Level Raw: ");
  Serial.println(currentData.rainLevelRaw);
  
  Serial.print("  ☀️ Light Detected: ");
  Serial.println(currentData.lightDetected ? "YES" : "NO");
  
  Serial.print("  🔌 Relay Status: ");
  Serial.println(currentData.relayStatus);
}

// ============================================================================
// FIREBASE DATA TRANSMISSION
// ============================================================================

void sendSensorDataToFirebase() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi disconnected, reconnecting...");
    connectToWiFi();
    return;
  }
  
  HTTPClient http;
  
  // Send latest sensor data
  String latestUrl = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/sensors/latest.json";
  http.begin(latestUrl);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<800> latestDoc;
  latestDoc["soilMoistureRaw"] = currentData.soilMoistureRaw;
  latestDoc["soilMoisturePct"] = currentData.soilMoisturePct;
  latestDoc["airTemperature"] = currentData.airTemperature;
  latestDoc["airHumidity"] = currentData.airHumidity;
  latestDoc["soilTemperature"] = currentData.soilTemperature;
  latestDoc["airQualityIndex"] = currentData.airQualityIndex;
  
  // Gas levels object
  JsonObject gases = latestDoc.createNestedObject("gases");
  gases["co2"] = currentData.gases.co2;
  gases["nh3"] = currentData.gases.nh3;
  
  latestDoc["lightDetected"] = currentData.lightDetected;
  latestDoc["rainLevelRaw"] = currentData.rainLevelRaw;
  latestDoc["relayStatus"] = currentData.relayStatus;
  latestDoc["timestamp"] = currentData.timestamp;
  
  String latestJson;
  serializeJson(latestDoc, latestJson);
  
  int latestResponse = http.PUT(latestJson);
  http.end();
  
  // Send to history (with timestamp as key)
  String historyUrl = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/sensors/history/" + String(currentData.timestamp) + ".json";
  http.begin(historyUrl);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<800> historyDoc;
  historyDoc["soilMoistureRaw"] = currentData.soilMoistureRaw;
  historyDoc["soilMoisturePct"] = currentData.soilMoisturePct;
  historyDoc["airTemperature"] = currentData.airTemperature;
  historyDoc["airHumidity"] = currentData.airHumidity;
  historyDoc["soilTemperature"] = currentData.soilTemperature;
  historyDoc["airQualityIndex"] = currentData.airQualityIndex;
  
  // Gas levels object
  JsonObject historyGases = historyDoc.createNestedObject("gases");
  historyGases["co2"] = currentData.gases.co2;
  historyGases["nh3"] = currentData.gases.nh3;
  
  historyDoc["lightDetected"] = currentData.lightDetected;
  historyDoc["rainLevelRaw"] = currentData.rainLevelRaw;
  historyDoc["relayStatus"] = currentData.relayStatus;
  historyDoc["timestamp"] = currentData.timestamp;
  
  String historyJson;
  serializeJson(historyDoc, historyJson);
  
  int historyResponse = http.PUT(historyJson);
  http.end();
  
  if (latestResponse == 200 && historyResponse == 200) {
    Serial.println("✅ Data sent to Firebase successfully");
    
    // Update lastSeen timestamp for device online/offline detection
    updateLastSeen();
  } else {
    Serial.print("❌ Failed to send data. Latest: ");
    Serial.print(latestResponse);
    Serial.print(", History: ");
    Serial.println(historyResponse);
  }
}

// Update lastSeen timestamp for device online/offline detection
void updateLastSeen() {
  HTTPClient http;
  String lastSeenUrl = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/meta/lastSeen.json";
  http.begin(lastSeenUrl);
  http.addHeader("Content-Type", "application/json");
  
  String lastSeenJson = String(currentData.timestamp);
  int response = http.PUT(lastSeenJson);
  http.end();
  
  if (response == 200) {
    Serial.println("✅ LastSeen timestamp updated");
  } else {
    Serial.print("❌ Failed to update lastSeen: ");
    Serial.println(response);
  }
}

// Check for instant relay control commands
void checkInstantRelayControl() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  String relayUrl = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/control/relay/status.json";
  http.begin(relayUrl);
  
  int response = http.GET();
  if (response == 200) {
    String payload = http.getString();
    http.end();
    
    // Parse the relay status
    if (payload == "\"on\"" || payload == "on") {
      if (currentData.relayStatus != "on") {
        Serial.println("⚡ INSTANT: Relay control received - turning ON");
        digitalWrite(RELAY_PIN, LOW); // Active LOW
        currentData.relayStatus = "on";
        controlData.relayStatus = "on";
        controlData.lastChangedBy = "user";
        controlData.timestamp = getUnixTimestamp();
        
        // Update relay status in Firebase immediately
        updateRelayStatusInFirebase("on");
      }
    } else if (payload == "\"off\"" || payload == "off") {
      if (currentData.relayStatus != "off") {
        Serial.println("⚡ INSTANT: Relay control received - turning OFF");
        digitalWrite(RELAY_PIN, HIGH); // Active LOW
        currentData.relayStatus = "off";
        controlData.relayStatus = "off";
        controlData.lastChangedBy = "user";
        controlData.timestamp = getUnixTimestamp();
        
        // Update relay status in Firebase immediately
        updateRelayStatusInFirebase("off");
      }
    }
  } else {
    http.end();
  }
}

// Update relay status in Firebase immediately
void updateRelayStatusInFirebase(String status) {
  HTTPClient http;
  String statusUrl = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/sensors/latest/relayStatus.json";
  http.begin(statusUrl);
  http.addHeader("Content-Type", "application/json");
  
  String statusJson = "\"" + status + "\"";
  int response = http.PUT(statusJson);
  http.end();
  
  if (response == 200) {
    Serial.println("✅ Relay status updated in Firebase: " + status);
  } else {
    Serial.print("❌ Failed to update relay status: ");
    Serial.println(response);
  }
}

// ============================================================================
// IRRIGATION CONTROL FUNCTIONS
// ============================================================================

void checkSmartIrrigation() {
  if (controlData.mode == "auto") {
    // Automatic irrigation based on soil moisture
    if (currentData.soilMoisturePct < 10 && currentData.relayStatus != "on") {
      Serial.println("🌱 Auto Irrigation: Soil moisture low, starting pump");
      turnPumpOn("AUTO_START");
    } else if (currentData.soilMoisturePct >= 30 && currentData.relayStatus == "on") {
      Serial.println("🌱 Auto Irrigation: Soil moisture adequate, stopping pump");
      turnPumpOff("AUTO_STOP");
    }
  }
}

void turnPumpOn(String reason) {
  digitalWrite(RELAY_PIN, LOW); // Relay is active LOW
  currentData.relayStatus = "on";
  controlData.relayStatus = "on";
  controlData.lastChangedBy = "system";
  controlData.timestamp = getUnixTimestamp();
  sendIrrigationEvent(reason, "Pump turned ON");
}

void turnPumpOff(String reason) {
  digitalWrite(RELAY_PIN, HIGH); // Relay is active LOW
  currentData.relayStatus = "off";
  controlData.relayStatus = "off";
  controlData.lastChangedBy = "system";
  controlData.timestamp = getUnixTimestamp();
  sendIrrigationEvent(reason, "Pump turned OFF");
}

void sendIrrigationEvent(String action, String description) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/irrigation/events/" + String(millis()) + ".json";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<300> eventDoc;
  eventDoc["action"] = action;
  eventDoc["description"] = description;
  eventDoc["timestamp"] = getUnixTimestamp();
  eventDoc["soilMoisture"] = currentData.soilMoisturePct;
  eventDoc["relayStatus"] = currentData.relayStatus;
  
  String eventJson;
  serializeJson(eventDoc, eventJson);
  
  int response = http.PUT(eventJson);
  http.end();
  
  if (response == 200) {
    Serial.println("✅ Irrigation event logged to Firebase");
  }
}

// ============================================================================
// CONTROL COMMAND CHECKING
// ============================================================================

void checkForControlCommands() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    return;
  }
  
  HTTPClient http;
  
  // Check irrigation mode
  String irrigationUrl = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/control/irrigation.json";
  http.begin(irrigationUrl);
  int irrigationResponse = http.GET();
  
  if (irrigationResponse == 200) {
    String irrigationPayload = http.getString();
    StaticJsonDocument<200> irrigationDoc;
    deserializeJson(irrigationDoc, irrigationPayload);
    
    if (irrigationDoc.containsKey("mode")) {
      String newMode = irrigationDoc["mode"];
      if (newMode != controlData.mode) {
        controlData.mode = newMode;
        Serial.println("🔄 Irrigation mode changed to: " + newMode);
      }
    }
  }
  http.end();
  
  // Check relay control
  String relayUrl = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/control/relay.json";
  http.begin(relayUrl);
  int relayResponse = http.GET();
  
  if (relayResponse == 200) {
    String relayPayload = http.getString();
    StaticJsonDocument<200> relayDoc;
    deserializeJson(relayDoc, relayPayload);
    
    if (relayDoc.containsKey("status")) {
      String newStatus = relayDoc["status"];
      
      if (newStatus != currentData.relayStatus) {
        if (newStatus == "on") {
          turnPumpOn("MANUAL_ON");
        } else {
          turnPumpOff("MANUAL_OFF");
        }
      }
    }
  }
  http.end();
}

// ============================================================================
// SCHEDULE CHECKING
// ============================================================================

void checkIrrigationSchedules() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String schedulesUrl = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/schedules.json";
  http.begin(schedulesUrl);
  int response = http.GET();
  
  if (response == 200) {
    String payload = http.getString();
    StaticJsonDocument<1000> schedulesDoc;
    deserializeJson(schedulesDoc, payload);
    
    // Check if current time matches any active schedule
    for (JsonPair schedule : schedulesDoc.as<JsonObject>()) {
      if (schedule.value()["enabled"] == true) {
        String startTime = schedule.value()["startTime"];
        String endTime = schedule.value()["stopTime"];
        String type = schedule.value()["type"];
        
        // Simple time checking (you might want to implement more sophisticated time handling)
        if (shouldRunSchedule(startTime, endTime, type)) {
          if (currentData.relayStatus != "on") {
            turnPumpOn("SCHEDULED_START");
            Serial.println("⏰ Scheduled irrigation started");
          }
        } else {
          if (currentData.relayStatus == "on") {
            turnPumpOff("SCHEDULED_STOP");
            Serial.println("⏰ Scheduled irrigation stopped");
          }
        }
      }
    }
  }
  http.end();
}

bool shouldRunSchedule(String startTime, String endTime, String type) {
  // This is a simplified implementation
  // In a real application, you'd want to implement proper time parsing and comparison
  // For now, this is a placeholder that always returns false
  return false;
}

// ============================================================================
// SELF-TEST MODE
// ============================================================================

void runSelfTest() {
  Serial.println("🧪 Running Self-Test Mode...");
  Serial.println("=====================================");
  
  // Test all sensors
  Serial.println("📊 Testing all sensors...");
  readAllSensors();
  
  // Test Relay
  Serial.println("  🔧 Testing Pump Relay...");
  digitalWrite(RELAY_PIN, LOW); // Turn ON
  delay(1000);
  bool relayOn = !digitalRead(RELAY_PIN);
  Serial.print("    Relay ON: ");
  Serial.println(relayOn ? "✅ SUCCESS" : "❌ FAILED");
  
  digitalWrite(RELAY_PIN, HIGH); // Turn OFF
  delay(1000);
  bool relayOff = !digitalRead(RELAY_PIN);
  Serial.print("    Relay OFF: ");
  Serial.println(!relayOff ? "✅ SUCCESS" : "❌ FAILED");
  
  Serial.println("=====================================");
  Serial.println("🧪 Self-Test Complete!");
  Serial.println();
}
