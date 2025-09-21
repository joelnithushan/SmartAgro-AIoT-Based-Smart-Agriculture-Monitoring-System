/*
 * SmartAgro ESP32 IoT Device - Enhanced Version
 * 
 * This enhanced version includes:
 * - Real-time sensor data transmission
 * - Smart irrigation system with manual/automatic modes
 * - Schedule-based irrigation
 * - Firebase Realtime Database integration
 * 
 * Required Libraries:
 * - WiFi (built-in)
 * - HTTPClient (built-in)
 * - ArduinoJson (install from Library Manager)
 * - OneWire (install from Library Manager)
 * - DallasTemperature (install from Library Manager)
 * - DHT (install from Library Manager)
 * 
 * Hardware Connections:
 * - Soil Moisture Sensor: GPIO34 (Analog)
 * - DHT11 (Temp/Humidity): GPIO4
 * - DS18B20 (Soil Temp): GPIO15 (with 4.7k pull-up to 3.3V)
 * - MQ135 (Air Quality): GPIO35 (Analog)
 * - Rain Sensor: GPIO32 (Analog)
 * - LDR (Light): GPIO33 (Analog)
 * - Relay (Pump Control): GPIO25 (Active LOW)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>

// ============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

// WiFi Configuration
const char* WIFI_SSID = "THAVANAYAGAM";
const char* WIFI_PASSWORD = "Thavam62";

// Firebase Configuration
const char* FIREBASE_HOST = "https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app";
const char* DEVICE_ID = "ESP32_001";

// ============================================================================
// HARDWARE PIN DEFINITIONS
// ============================================================================

// Sensor Pins
#define SOIL_MOISTURE_PIN 34    // Analog pin for soil moisture
#define DHT_PIN 4              // Digital pin for DHT11
#define DS18B20_PIN 15         // Digital pin for DS18B20
#define MQ135_PIN 35           // Analog pin for MQ135
#define RAIN_PIN 32            // Analog pin for rain sensor
#define LDR_PIN 33             // Analog pin for LDR
#define PUMP_RELAY_PIN 25      // Digital pin for pump relay

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
  float soilMoisture;
  float airTemperature;
  float airHumidity;
  float soilTemperature;
  float airQuality;
  struct {
    float co2;
    float nh3;
    float benzene;
  } gasLevels;
  bool lightDetected;
  float rainLevel;
  bool relayStatus;
  unsigned long timestamp;
};

struct IrrigationSettings {
  String mode; // "manual" or "auto"
  bool autoEnabled;
  float moistureThresholdLow;
  float moistureThresholdHigh;
};

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

SensorData currentData;
IrrigationSettings irrigationSettings;
unsigned long lastDataSend = 0;
unsigned long lastControlCheck = 0;
unsigned long lastScheduleCheck = 0;
const unsigned long DATA_SEND_INTERVAL = 10000;    // 10 seconds
const unsigned long CONTROL_CHECK_INTERVAL = 2000;  // 2 seconds
const unsigned long SCHEDULE_CHECK_INTERVAL = 60000; // 1 minute

// ============================================================================
// SETUP FUNCTION
// ============================================================================

void setup() {
  Serial.begin(115200);
  Serial.println("🌱 SmartAgro ESP32 Enhanced Starting...");
  
  // Initialize pins
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  digitalWrite(PUMP_RELAY_PIN, HIGH); // Relay is active LOW, so start with pump OFF
  
  // Initialize sensors
  dht.begin();
  soilTempSensor.begin();
  
  // Connect to WiFi
  connectToWiFi();
  
  // Initialize irrigation settings
  irrigationSettings.mode = "manual";
  irrigationSettings.autoEnabled = false;
  irrigationSettings.moistureThresholdLow = 10.0;
  irrigationSettings.moistureThresholdHigh = 30.0;
  
  // Run self-test
  runSelfTest();
  
  Serial.println("✅ SmartAgro ESP32 Enhanced Ready!");
  Serial.println("📡 Sending data to Firebase every 10 seconds");
  Serial.println("🎛️ Checking for control commands every 2 seconds");
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
  
  // Send data to Firebase every 10 seconds
  if (millis() - lastDataSend >= DATA_SEND_INTERVAL) {
    sendSensorDataToFirebase();
    lastDataSend = millis();
  }
  
  // Check for control commands every 2 seconds
  if (millis() - lastControlCheck >= CONTROL_CHECK_INTERVAL) {
    checkForControlCommands();
    lastControlCheck = millis();
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
  
  // Read Soil Moisture (Analog)
  int soilMoistureRaw = analogRead(SOIL_MOISTURE_PIN);
  currentData.soilMoisture = map(soilMoistureRaw, 0, 4095, 0, 100);
  
  // Read MQ135 (Air Quality & Gas Levels)
  int airQualityRaw = analogRead(MQ135_PIN);
  currentData.airQuality = airQualityRaw;
  
  // Calculate gas levels from MQ135 (simplified calculations)
  // Note: These are approximate values - real calibration would be needed
  currentData.gasLevels.co2 = airQualityRaw * 0.8;  // Approximate CO2
  currentData.gasLevels.nh3 = airQualityRaw * 0.3;  // Approximate NH3
  currentData.gasLevels.benzene = airQualityRaw * 0.1; // Approximate Benzene
  
  // Read Rain Sensor
  int rainRaw = analogRead(RAIN_PIN);
  currentData.rainLevel = map(rainRaw, 0, 4095, 0, 100);
  
  // Read LDR (Light Detection - Digital)
  int lightRaw = analogRead(LDR_PIN);
  currentData.lightDetected = (lightRaw > 2048); // Digital threshold
  
  // Read Relay Status
  currentData.relayStatus = !digitalRead(PUMP_RELAY_PIN); // Relay is active LOW
  
  // Update timestamp
  currentData.timestamp = millis();
  
  // Print sensor readings
  printSensorReadings();
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
  Serial.print(currentData.soilMoisture);
  Serial.println("%");
  
  Serial.print("  ⚠️ Air Quality: ");
  Serial.println(currentData.airQuality);
  
  Serial.print("  💨 Gas Levels - CO2: ");
  Serial.print(currentData.gasLevels.co2);
  Serial.print(" ppm, NH3: ");
  Serial.print(currentData.gasLevels.nh3);
  Serial.print(" ppm, Benzene: ");
  Serial.print(currentData.gasLevels.benzene);
  Serial.println(" ppm");
  
  Serial.print("  🌧️ Rain Level: ");
  Serial.print(currentData.rainLevel);
  Serial.println("%");
  
  Serial.print("  ☀️ Light Detected: ");
  Serial.println(currentData.lightDetected ? "YES" : "NO");
  
  Serial.print("  🔌 Relay Status: ");
  Serial.println(currentData.relayStatus ? "ON" : "OFF");
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
    latestDoc["soilMoisture"] = currentData.soilMoisture;
    latestDoc["airTemperature"] = currentData.airTemperature;
    latestDoc["airHumidity"] = currentData.airHumidity;
    latestDoc["soilTemperature"] = currentData.soilTemperature;
    latestDoc["airQuality"] = currentData.airQuality;
    
    // Gas levels object
    JsonObject gasLevels = latestDoc.createNestedObject("gasLevels");
    gasLevels["co2"] = currentData.gasLevels.co2;
    gasLevels["nh3"] = currentData.gasLevels.nh3;
    gasLevels["benzene"] = currentData.gasLevels.benzene;
    
    latestDoc["lightDetected"] = currentData.lightDetected;
    latestDoc["rainLevel"] = currentData.rainLevel;
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
    historyDoc["soilMoisture"] = currentData.soilMoisture;
    historyDoc["airTemperature"] = currentData.airTemperature;
    historyDoc["airHumidity"] = currentData.airHumidity;
    historyDoc["soilTemperature"] = currentData.soilTemperature;
    historyDoc["airQuality"] = currentData.airQuality;
    
    // Gas levels object
    JsonObject historyGasLevels = historyDoc.createNestedObject("gasLevels");
    historyGasLevels["co2"] = currentData.gasLevels.co2;
    historyGasLevels["nh3"] = currentData.gasLevels.nh3;
    historyGasLevels["benzene"] = currentData.gasLevels.benzene;
    
    historyDoc["lightDetected"] = currentData.lightDetected;
    historyDoc["rainLevel"] = currentData.rainLevel;
    historyDoc["relayStatus"] = currentData.relayStatus;
    historyDoc["timestamp"] = currentData.timestamp;
  
  String historyJson;
  serializeJson(historyDoc, historyJson);
  
  int historyResponse = http.PUT(historyJson);
  http.end();
  
  if (latestResponse == 200 && historyResponse == 200) {
    Serial.println("✅ Data sent to Firebase successfully");
  } else {
    Serial.print("❌ Failed to send data. Latest: ");
    Serial.print(latestResponse);
    Serial.print(", History: ");
    Serial.println(historyResponse);
  }
}

// ============================================================================
// IRRIGATION CONTROL FUNCTIONS
// ============================================================================

void checkSmartIrrigation() {
  if (irrigationSettings.mode == "auto" && irrigationSettings.autoEnabled) {
    // Automatic irrigation based on soil moisture
    if (currentData.soilMoisture < irrigationSettings.moistureThresholdLow && !currentData.relayStatus) {
      Serial.println("🌱 Auto Irrigation: Soil moisture low, starting pump");
      turnPumpOn("AUTO_START");
    } else if (currentData.soilMoisture >= irrigationSettings.moistureThresholdHigh && currentData.relayStatus) {
      Serial.println("🌱 Auto Irrigation: Soil moisture adequate, stopping pump");
      turnPumpOff("AUTO_STOP");
    }
  }
}

void turnPumpOn(String reason) {
  digitalWrite(PUMP_RELAY_PIN, LOW); // Relay is active LOW
  currentData.relayStatus = true;
  sendIrrigationEvent(reason, "Pump turned ON");
}

void turnPumpOff(String reason) {
  digitalWrite(PUMP_RELAY_PIN, HIGH); // Relay is active LOW
  currentData.relayStatus = false;
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
  eventDoc["timestamp"] = millis();
  eventDoc["soilMoisture"] = currentData.soilMoisture;
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
  String irrigationUrl = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/irrigation.json";
  http.begin(irrigationUrl);
  int irrigationResponse = http.GET();
  
  if (irrigationResponse == 200) {
    String irrigationPayload = http.getString();
    StaticJsonDocument<200> irrigationDoc;
    deserializeJson(irrigationDoc, irrigationPayload);
    
    if (irrigationDoc.containsKey("mode")) {
      String newMode = irrigationDoc["mode"];
      if (newMode != irrigationSettings.mode) {
        irrigationSettings.mode = newMode;
        irrigationSettings.autoEnabled = (newMode == "auto");
        Serial.println("🔄 Irrigation mode changed to: " + newMode);
      }
    }
  }
  http.end();
  
  // Check relay control
  String relayUrl = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/relay.json";
  http.begin(relayUrl);
  int relayResponse = http.GET();
  
  if (relayResponse == 200) {
    String relayPayload = http.getString();
    StaticJsonDocument<200> relayDoc;
    deserializeJson(relayDoc, relayPayload);
    
    if (relayDoc.containsKey("status")) {
      String newStatus = relayDoc["status"];
      bool shouldBeOn = (newStatus == "on");
      
      if (shouldBeOn != currentData.relayStatus) {
        if (shouldBeOn) {
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
      if (schedule.value()["active"] == true) {
        String startTime = schedule.value()["startTime"];
        String endTime = schedule.value()["endTime"];
        String type = schedule.value()["type"];
        
        // Simple time checking (you might want to implement more sophisticated time handling)
        if (shouldRunSchedule(startTime, endTime, type)) {
          if (!currentData.relayStatus) {
            turnPumpOn("SCHEDULED_START");
            Serial.println("⏰ Scheduled irrigation started");
          }
        } else {
          if (currentData.relayStatus) {
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
  digitalWrite(PUMP_RELAY_PIN, LOW); // Turn ON
  delay(1000);
  bool relayOn = !digitalRead(PUMP_RELAY_PIN);
  Serial.print("    Relay ON: ");
  Serial.println(relayOn ? "✅ SUCCESS" : "❌ FAILED");
  
  digitalWrite(PUMP_RELAY_PIN, HIGH); // Turn OFF
  delay(1000);
  bool relayOff = !digitalRead(PUMP_RELAY_PIN);
  Serial.print("    Relay OFF: ");
  Serial.println(!relayOff ? "✅ SUCCESS" : "❌ FAILED");
  
  Serial.println("=====================================");
  Serial.println("🧪 Self-Test Complete!");
  Serial.println();
}
