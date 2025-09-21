/*
 * SmartAgro ESP32 Production Firmware - Updated for Instant Relay Control
 * 
 * Features:
 * - Real-time sensor monitoring with instant relay control
 * - Active LOW relay control (GPIO14)
 * - Firebase Realtime Database integration
 * - Automatic irrigation with configurable thresholds
 * - Schedule-based irrigation
 * - Device metadata and online status tracking
 * 
 * Pin Configuration (MUST MATCH):
 * - Soil Moisture (ADC) → GPIO34 (calibrate dry=2910, wet=1465)
 * - DHT11 → GPIO4
 * - Relay (Pump control) → GPIO14 (ACTIVE LOW: LOW = ON, HIGH = OFF)
 * - Rain Sensor (ADC) → GPIO32
 * - MQ135 (ADC) → GPIO35
 * - LDR (Digital) → GPIO15 (DO)
 * - DS18B20 (1-wire) → GPIO25 (use 4.7k pull-up to 3.3V)
 * - Power: 3V3 & GND as appropriate
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ============================================================================
// CONFIGURATION
// ============================================================================

// WiFi Configuration
const char* WIFI_SSID = "THAVANAYAGAM";
const char* WIFI_PASSWORD = "Thavam62";

// Firebase Configuration
const char* FIREBASE_HOST = "https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app";
const char* DEVICE_ID = "ESP32_001"; // Change this for each device

// Pin Definitions (MUST MATCH SPECIFICATIONS)
#define SOIL_MOISTURE_PIN 34
#define DHT_PIN 4
#define RELAY_PIN 14  // ACTIVE LOW: LOW = ON, HIGH = OFF
#define RAIN_SENSOR_PIN 32
#define MQ135_PIN 35
#define LDR_PIN 15
#define DS18B20_PIN 25

// Sensor Configuration
#define DHT_TYPE DHT11
#define SOIL_MOISTURE_DRY 2910
#define SOIL_MOISTURE_WET 1465
#define RAIN_THRESHOLD 1000
#define LDR_THRESHOLD 500

// Timing Configuration - OPTIMIZED FOR SPEED
#define SENSOR_READ_INTERVAL 5000   // 5 seconds (faster sensor updates)
#define RELAY_CHECK_INTERVAL 200    // 200ms for ULTRA-FAST control
#define METADATA_UPDATE_INTERVAL 10000  // 10 seconds (faster online detection)
#define FIREBASE_TIMEOUT 5000       // 5 second timeout for faster failures

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

// Sensor Objects
DHT dht(DHT_PIN, DHT_TYPE);
OneWire oneWire(DS18B20_PIN);
DallasTemperature soilTempSensor(&oneWire);

// Sensor Data Structure
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

// Control Data Structure
struct ControlData {
  String irrigationMode;
  String relayStatus;
  String lastChangedBy;
  unsigned long timestamp;
  struct {
    int soilMoistureLow;
    int soilMoistureHigh;
  } thresholds;
};

// Schedule Data Structure
struct ScheduleData {
  String name;
  String type;
  String startTime;
  String endTime;
  String days[7];
  bool enabled;
};

// Global Variables
SensorData currentData;
ControlData controlData;
ScheduleData schedules[10];
int scheduleCount = 0;
unsigned long lastSensorRead = 0;
unsigned long lastRelayCheck = 0;
unsigned long lastMetadataUpdate = 0;
bool relayActiveLow = true; // This device uses ACTIVE LOW relay

// ============================================================================
// SETUP FUNCTION
// ============================================================================

void setup() {
  Serial.begin(115200);
  Serial.println("🌱 SmartAgro ESP32 Starting...");
  
  // Initialize pins
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LDR_PIN, INPUT);
  digitalWrite(RELAY_PIN, HIGH); // Start with relay OFF (ACTIVE LOW)
  
  // Initialize sensors
  Serial.println("🔧 Initializing sensors...");
  dht.begin();
  Serial.println("✅ DHT11 initialized");
  
  soilTempSensor.begin();
  Serial.println("✅ DS18B20 sensor initialized");
  
  // Test DS18B20 sensor detection
  int deviceCount = soilTempSensor.getDeviceCount();
  Serial.println("🔍 DS18B20 devices found: " + String(deviceCount));
  
  if (deviceCount == 0) {
    Serial.println("❌ No DS18B20 sensors detected!");
    Serial.println("🔧 Check connections:");
    Serial.println("   - DS18B20 data pin → GPIO25");
    Serial.println("   - 4.7kΩ pull-up resistor between data pin and 3.3V");
    Serial.println("   - VCC → 3.3V, GND → GND");
  } else {
    Serial.println("✅ DS18B20 sensor detected successfully");
  }
  
  // Initialize control data
  controlData.irrigationMode = "manual";
  controlData.relayStatus = "off";
  controlData.thresholds.soilMoistureLow = 10;
  controlData.thresholds.soilMoistureHigh = 30;
  
  // Connect to WiFi
  connectToWiFi();
  
  // Initialize device metadata
  initializeDeviceMetadata();
  
  // Load initial control settings
  loadControlSettings();
  
  Serial.println("✅ SmartAgro ESP32 Ready!");
}

// ============================================================================
// MAIN LOOP
// ============================================================================

void loop() {
  unsigned long currentTime = millis();
  
  // PRIORITY 1: Check for instant relay control commands (ULTRA-FAST - 200ms)
  if (currentTime - lastRelayCheck >= RELAY_CHECK_INTERVAL) {
    checkInstantRelayControl();
    lastRelayCheck = currentTime;
  }
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("📶 WiFi disconnected, reconnecting...");
    connectToWiFi();
    return;
  }
  
  // PRIORITY 2: Read sensors at regular intervals (5 seconds)
  if (currentTime - lastSensorRead >= SENSOR_READ_INTERVAL) {
    readAllSensors();
    sendSensorData();
    lastSensorRead = currentTime;
  }
  
  // PRIORITY 3: Update device metadata (10 seconds)
  if (currentTime - lastMetadataUpdate >= METADATA_UPDATE_INTERVAL) {
    updateDeviceMetadata();
    lastMetadataUpdate = currentTime;
  }
  
  // PRIORITY 4: Check for control settings updates
  checkControlSettings();
  
  // PRIORITY 5: Check for schedule updates
  checkSchedules();
  
  // PRIORITY 6: Perform automatic irrigation if enabled
  if (controlData.irrigationMode == "auto") {
    checkSmartIrrigation();
  }
  
  // PRIORITY 7: Check scheduled irrigation
  checkScheduledIrrigation();
  
  delay(50); // Reduced delay for faster response
}

// ============================================================================
// WIFI FUNCTIONS
// ============================================================================

void connectToWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("📶 Connecting to WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ WiFi connected!");
    Serial.print("📡 IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("❌ WiFi connection failed");
  }
}

// ============================================================================
// SENSOR FUNCTIONS
// ============================================================================

void readAllSensors() {
  Serial.println("🔍 Reading sensors...");
  
  // Soil Moisture (ADC)
  currentData.soilMoistureRaw = analogRead(SOIL_MOISTURE_PIN);
  currentData.soilMoisturePct = map(currentData.soilMoistureRaw, SOIL_MOISTURE_DRY, SOIL_MOISTURE_WET, 0, 100);
  currentData.soilMoisturePct = constrain(currentData.soilMoisturePct, 0, 100);
  
  // DHT11 (Air Temperature & Humidity)
  currentData.airTemperature = dht.readTemperature();
  currentData.airHumidity = dht.readHumidity();
  
  // DS18B20 (Soil Temperature)
  Serial.println("🌡️ Reading DS18B20 soil temperature sensor...");
  soilTempSensor.requestTemperatures();
  currentData.soilTemperature = soilTempSensor.getTempCByIndex(0);
  
  // Check if DS18B20 reading failed
  if (currentData.soilTemperature == DEVICE_DISCONNECTED_C) {
    Serial.println("❌ DS18B20 sensor disconnected or not found!");
    Serial.println("🔧 Check connections: DS18B20 data pin → GPIO25, 4.7k pull-up to 3.3V");
    currentData.soilTemperature = -127; // Keep error value for debugging
  } else if (currentData.soilTemperature == 85.0) {
    Serial.println("⚠️ DS18B20 sensor reading 85°C (power-on reset value)");
    Serial.println("🔧 Sensor may be initializing or have connection issues");
  } else {
    Serial.println("✅ DS18B20 sensor reading: " + String(currentData.soilTemperature) + "°C");
  }
  
  // MQ135 (Air Quality)
  currentData.airQualityIndex = analogRead(MQ135_PIN);
  currentData.gases.co2 = calculateCO2(currentData.airQualityIndex);
  currentData.gases.nh3 = calculateNH3(currentData.airQualityIndex);
  
  // LDR (Light Detection)
  currentData.lightDetected = digitalRead(LDR_PIN);
  
  // Rain Sensor (ADC)
  currentData.rainLevelRaw = analogRead(RAIN_SENSOR_PIN);
  
  // Relay Status
  currentData.relayStatus = controlData.relayStatus;
  
  // Timestamp
  currentData.timestamp = millis();
  
  // Print sensor readings
  Serial.println("📊 Sensor Readings:");
  Serial.println("  Soil Moisture: " + String(currentData.soilMoistureRaw) + " (" + String(currentData.soilMoisturePct) + "%)");
  Serial.println("  Air Temperature: " + String(currentData.airTemperature) + "°C");
  Serial.println("  Air Humidity: " + String(currentData.airHumidity) + "%");
  Serial.println("  Soil Temperature: " + String(currentData.soilTemperature) + "°C");
  Serial.println("  Air Quality: " + String(currentData.airQualityIndex) + " (" + String(currentData.gases.co2) + " CO2, " + String(currentData.gases.nh3) + " NH3)");
  Serial.println("  Light: " + String(currentData.lightDetected ? "Detected" : "Dark"));
  Serial.println("  Rain: " + String(currentData.rainLevelRaw));
  Serial.println("  Relay: " + currentData.relayStatus);
}

int calculateCO2(int rawValue) {
  // Simplified CO2 calculation (calibrate based on your specific sensor)
  return map(rawValue, 0, 4095, 300, 1000);
}

int calculateNH3(int rawValue) {
  // Simplified NH3 calculation (calibrate based on your specific sensor)
  return map(rawValue, 0, 4095, 0, 50);
}

// ============================================================================
// FIREBASE FUNCTIONS
// ============================================================================

void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/sensors/latest.json";
  
  http.begin(url);
  http.setTimeout(FIREBASE_TIMEOUT);  // 5 second timeout
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Connection", "close");  // Faster connection handling
  
  // Create JSON payload
  StaticJsonDocument<500> doc;
  doc["soilMoistureRaw"] = currentData.soilMoistureRaw;
  doc["soilMoisturePct"] = currentData.soilMoisturePct;
  doc["airTemperature"] = currentData.airTemperature;
  doc["airHumidity"] = currentData.airHumidity;
  doc["soilTemperature"] = currentData.soilTemperature;
  doc["airQualityIndex"] = currentData.airQualityIndex;
  doc["gases"]["co2"] = currentData.gases.co2;
  doc["gases"]["nh3"] = currentData.gases.nh3;
  doc["lightDetected"] = currentData.lightDetected;
  doc["rainLevelRaw"] = currentData.rainLevelRaw;
  doc["relayStatus"] = currentData.relayStatus;
  doc["timestamp"] = currentData.timestamp;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("🔄 Sending sensor data to: " + url);
  Serial.println("📡 Data: " + jsonString);
  
  int response = http.PUT(jsonString);
  http.end();
  
  if (response == 200) {
    Serial.println("✅ Sensor data sent to Firebase successfully");
    
    // Also save to history
    saveToHistory();
  } else {
    Serial.print("❌ Failed to send sensor data. Response code: ");
    Serial.println(response);
    Serial.println("🔍 Check Firebase rules and connection");
  }
}

void saveToHistory() {
  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/sensors/history/" + String(currentData.timestamp) + ".json";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<500> doc;
  doc["soilMoistureRaw"] = currentData.soilMoistureRaw;
  doc["soilMoisturePct"] = currentData.soilMoisturePct;
  doc["airTemperature"] = currentData.airTemperature;
  doc["airHumidity"] = currentData.airHumidity;
  doc["soilTemperature"] = currentData.soilTemperature;
  doc["airQualityIndex"] = currentData.airQualityIndex;
  doc["gases"]["co2"] = currentData.gases.co2;
  doc["gases"]["nh3"] = currentData.gases.nh3;
  doc["lightDetected"] = currentData.lightDetected;
  doc["rainLevelRaw"] = currentData.rainLevelRaw;
  doc["relayStatus"] = currentData.relayStatus;
  doc["timestamp"] = currentData.timestamp;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int response = http.PUT(jsonString);
  http.end();
  
  if (response == 200) {
    Serial.println("✅ Data saved to history");
  } else {
    Serial.print("❌ Failed to save to history: ");
    Serial.println(response);
  }
}

// ============================================================================
// INSTANT RELAY CONTROL
// ============================================================================

void checkInstantRelayControl() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("📶 WiFi not connected, skipping relay check");
    return;
  }
  
  unsigned long startTime = millis();
  
  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/control/relay/status.json";
  
  Serial.println("🔍 Checking for relay commands: " + url);
  Serial.println("🔍 Current relay status: " + controlData.relayStatus);
  Serial.println("🔍 Current GPIO" + String(RELAY_PIN) + " state: " + String(digitalRead(RELAY_PIN)));
  
  http.begin(url);
  http.setTimeout(2000);  // 2 second timeout for ultra-fast response
  http.addHeader("Connection", "close");
  int httpResponseCode = http.GET();
  
  Serial.println("📡 HTTP Response Code: " + String(httpResponseCode));
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    http.end();
    
    Serial.println("📦 Firebase Response: " + response);
    Serial.println("📦 Response length: " + String(response.length()));
    
    if (response != "null" && response.length() > 0) {
      // Parse JSON response to extract value
      DynamicJsonDocument doc(200);
      DeserializationError error = deserializeJson(doc, response);
      
      if (!error) {
        String newStatus = doc["value"].as<String>();
        Serial.println("🔍 Parsed status from JSON: '" + newStatus + "'");
        Serial.println("🔍 Current status: '" + controlData.relayStatus + "'");
        Serial.println("🔍 Status comparison: " + String(newStatus == controlData.relayStatus ? "SAME" : "DIFFERENT"));
        
        if (newStatus != controlData.relayStatus) {
          unsigned long responseTime = millis() - startTime;
          Serial.println("⚡ INSTANT: Relay command received: " + newStatus + " (Response time: " + String(responseTime) + "ms)");
          controlRelay(newStatus);
        } else {
          Serial.println("ℹ️ No change needed - status already: " + newStatus);
        }
      } else {
        Serial.println("⚠️ JSON parsing failed, trying fallback string parsing");
        Serial.println("⚠️ JSON error: " + String(error.c_str()));
        
        // Fallback: try to parse as simple string
        String cleanResponse = response;
        cleanResponse.replace("\"", "");
        cleanResponse.trim();
        Serial.println("🔍 Cleaned response: '" + cleanResponse + "'");
        
        if (cleanResponse != controlData.relayStatus) {
          unsigned long responseTime = millis() - startTime;
          Serial.println("⚡ INSTANT: Relay command received (fallback): " + cleanResponse + " (Response time: " + String(responseTime) + "ms)");
          controlRelay(cleanResponse);
        } else {
          Serial.println("ℹ️ No change needed (fallback) - status already: " + cleanResponse);
        }
      }
    } else {
      Serial.println("📭 No relay command data (response is null or empty)");
      Serial.println("📭 This means no command has been sent from the UI yet");
    }
  } else {
    Serial.println("❌ HTTP request failed with code: " + String(httpResponseCode));
    Serial.println("❌ This could be a Firebase connection issue");
    http.end();
  }
}

void controlRelay(String status) {
  Serial.println("🔧 ===== RELAY CONTROL START =====");
  Serial.println("🔧 controlRelay() called with status: '" + status + "'");
  Serial.println("🔧 relayActiveLow: " + String(relayActiveLow));
  Serial.println("🔧 RELAY_PIN: " + String(RELAY_PIN));
  Serial.println("🔧 Current GPIO state BEFORE: " + String(digitalRead(RELAY_PIN)));
  
  if (status == "on") {
    if (relayActiveLow) {
      digitalWrite(RELAY_PIN, LOW); // ACTIVE LOW: LOW = ON
      Serial.println("🔧 Set GPIO" + String(RELAY_PIN) + " to LOW (ACTIVE LOW = ON)");
    } else {
      digitalWrite(RELAY_PIN, HIGH); // ACTIVE HIGH: HIGH = ON
      Serial.println("🔧 Set GPIO" + String(RELAY_PIN) + " to HIGH (ACTIVE HIGH = ON)");
    }
    controlData.relayStatus = "on";
    Serial.println("💧 Pump turned ON - Relay should be ACTIVE");
  } else if (status == "off") {
    if (relayActiveLow) {
      digitalWrite(RELAY_PIN, HIGH); // ACTIVE LOW: HIGH = OFF
      Serial.println("🔧 Set GPIO" + String(RELAY_PIN) + " to HIGH (ACTIVE LOW = OFF)");
    } else {
      digitalWrite(RELAY_PIN, LOW); // ACTIVE HIGH: LOW = OFF
      Serial.println("🔧 Set GPIO" + String(RELAY_PIN) + " to LOW (ACTIVE HIGH = OFF)");
    }
    controlData.relayStatus = "off";
    Serial.println("💧 Pump turned OFF - Relay should be INACTIVE");
  } else {
    Serial.println("❌ Invalid relay status: '" + status + "'");
    Serial.println("❌ Expected 'on' or 'off'");
    return;
  }
  
  // Read back the pin state for verification
  int pinState = digitalRead(RELAY_PIN);
  Serial.println("🔧 GPIO" + String(RELAY_PIN) + " current state AFTER: " + String(pinState));
  Serial.println("🔧 Expected state: " + String(relayActiveLow ? (status == "on" ? "LOW" : "HIGH") : (status == "on" ? "HIGH" : "LOW")));
  
  // Verify the pin state is correct
  bool pinStateCorrect = false;
  if (relayActiveLow) {
    pinStateCorrect = (status == "on" && pinState == LOW) || (status == "off" && pinState == HIGH);
  } else {
    pinStateCorrect = (status == "on" && pinState == HIGH) || (status == "off" && pinState == LOW);
  }
  
  if (pinStateCorrect) {
    Serial.println("✅ GPIO pin state is CORRECT");
  } else {
    Serial.println("❌ GPIO pin state is INCORRECT - Hardware issue!");
  }
  
  Serial.println("🔧 ===== RELAY CONTROL END =====");
  
  // Update relay status in Firebase immediately
  updateRelayStatusInFirebase(status);
}

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
// DEVICE METADATA
// ============================================================================

void initializeDeviceMetadata() {
  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/meta.json";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<300> doc;
  doc["ownerId"] = "system";
  doc["lastSeen"] = millis();
  doc["status"] = "active";
  doc["relayActiveLow"] = relayActiveLow;
  doc["irrigationMode"] = controlData.irrigationMode;
  doc["firmwareVersion"] = "2.0.0";
  doc["initializedAt"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int response = http.PUT(jsonString);
  http.end();
  
  if (response == 200) {
    Serial.println("✅ Device metadata initialized");
  } else {
    Serial.print("❌ Failed to initialize metadata: ");
    Serial.println(response);
  }
}

void updateDeviceMetadata() {
  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/meta/lastSeen.json";
  
  http.begin(url);
  http.setTimeout(5000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Connection", "close");
  
  // Use millis() as timestamp - frontend will handle the conversion
  unsigned long currentTime = millis();
  String timestampJson = String(currentTime);
  Serial.println("🔄 Updating metadata: " + url);
  Serial.println("📡 Sending millis timestamp: " + timestampJson + " (milliseconds since boot)");
  
  int response = http.PUT(timestampJson);
  http.end();
  
  if (response == 200) {
    Serial.println("✅ Device metadata updated successfully");
  } else {
    Serial.print("❌ Failed to update metadata. Response code: ");
    Serial.println(response);
    Serial.println("🔍 Check Firebase rules and connection");
  }
}

// ============================================================================
// CONTROL SETTINGS
// ============================================================================

void loadControlSettings() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/control/irrigation.json";
  
  http.begin(url);
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    http.end();
    
    if (response != "null" && response.length() > 0) {
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, response);
      
      if (!error) {
        controlData.irrigationMode = doc["mode"].as<String>();
        Serial.println("📋 Irrigation mode loaded: " + controlData.irrigationMode);
      }
    }
  } else {
    http.end();
  }
  
  // Load thresholds
  loadThresholds();
}

void loadThresholds() {
  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/control/thresholds.json";
  
  http.begin(url);
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    http.end();
    
    if (response != "null" && response.length() > 0) {
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, response);
      
      if (!error) {
        controlData.thresholds.soilMoistureLow = doc["soilMoistureLow"];
        controlData.thresholds.soilMoistureHigh = doc["soilMoistureHigh"];
        Serial.println("📋 Thresholds loaded: " + String(controlData.thresholds.soilMoistureLow) + "% - " + String(controlData.thresholds.soilMoistureHigh) + "%");
      }
    }
  } else {
    http.end();
  }
}

void checkControlSettings() {
  // This would check for control setting updates periodically
  // Implementation depends on your specific needs
}

// ============================================================================
// SCHEDULING FUNCTIONS
// ============================================================================

void checkSchedules() {
  // This would check for schedule updates periodically
  // Implementation depends on your specific needs
}

void checkScheduledIrrigation() {
  // This would check if current time matches any scheduled irrigation
  // Implementation depends on your specific needs
}

// ============================================================================
// SMART IRRIGATION
// ============================================================================

void checkSmartIrrigation() {
  if (controlData.irrigationMode == "auto") {
    // Automatic irrigation based on soil moisture
    if (currentData.soilMoisturePct < controlData.thresholds.soilMoistureLow && currentData.relayStatus != "on") {
      Serial.println("🌱 Auto Irrigation: Soil moisture low (" + String(currentData.soilMoisturePct) + "%), starting pump");
      controlRelay("on");
    } else if (currentData.soilMoisturePct >= controlData.thresholds.soilMoistureHigh && currentData.relayStatus == "on") {
      Serial.println("🌱 Auto Irrigation: Soil moisture adequate (" + String(currentData.soilMoisturePct) + "%), stopping pump");
      controlRelay("off");
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

void printWiFiStatus() {
  Serial.println("📶 WiFi Status:");
  Serial.println("  SSID: " + String(WiFi.SSID()));
  Serial.println("  IP: " + WiFi.localIP().toString());
  Serial.println("  Signal: " + String(WiFi.RSSI()) + " dBm");
  Serial.println("  Status: " + String(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected"));
}

void printDeviceInfo() {
  Serial.println("🔧 Device Information:");
  Serial.println("  Device ID: " + String(DEVICE_ID));
  Serial.println("  Firmware: 2.0.0");
  Serial.println("  Relay Active Low: " + String(relayActiveLow ? "Yes" : "No"));
  Serial.println("  Irrigation Mode: " + controlData.irrigationMode);
  Serial.println("  Thresholds: " + String(controlData.thresholds.soilMoistureLow) + "% - " + String(controlData.thresholds.soilMoistureHigh) + "%");
}


