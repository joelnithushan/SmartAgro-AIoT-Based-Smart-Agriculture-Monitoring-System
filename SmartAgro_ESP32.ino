/*
 * SmartAgro ESP32 IoT Device
 * 
 * This code runs on ESP32 and connects to Firebase to send sensor data
 * and receive control commands for agricultural monitoring.
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
 * 
 * Firebase Configuration:
 * - Replace FIREBASE_HOST with your Firebase Realtime Database URL
 * - Replace FIREBASE_AUTH with your Firebase Auth token (optional)
 * - Replace DEVICE_ID with your unique device identifier
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
const char* FIREBASE_AUTH = ""; // Leave empty for public access
const char* DEVICE_ID = "ESP32_001"; // Change this to your unique device ID

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
// GLOBAL VARIABLES
// ============================================================================

// Sensor data storage
struct SensorData {
  float soilMoisture;
  float airTemp;
  float airHumidity;
  float soilTemp;
  float airQuality;
  float rainLevel;
  int lightLevel;
  bool pumpStatus;
  unsigned long timestamp;
};

SensorData currentData;
unsigned long lastDataSend = 0;
unsigned long lastControlCheck = 0;
const unsigned long DATA_SEND_INTERVAL = 10000; // Send data every 10 seconds
const unsigned long CONTROL_CHECK_INTERVAL = 2000; // Check for commands every 2 seconds

// ============================================================================
// SETUP FUNCTION
// ============================================================================

void setup() {
  Serial.begin(115200);
  Serial.println("🌱 SmartAgro ESP32 Starting...");
  
  // Initialize pins
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  digitalWrite(PUMP_RELAY_PIN, HIGH); // Relay is active LOW, so start with pump OFF
  
  // Initialize sensors
  dht.begin();
  soilTempSensor.begin();
  
  // Connect to WiFi
  connectToWiFi();
  
  // Run self-test mode
  runSelfTest();
  
  // Initialize Firebase connection
  initializeFirebase();
  
  Serial.println("✅ SmartAgro ESP32 Ready!");
  Serial.println("📡 Sending data to Firebase every 10 seconds");
  Serial.println("🎛️ Checking for control commands every 2 seconds");
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
    Serial.print("🌐 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("❌ WiFi Connection Failed!");
    Serial.println("🔄 Restarting in 10 seconds...");
    delay(10000);
    ESP.restart();
  }
}

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

void initializeFirebase() {
  Serial.println("🔥 Initializing Firebase connection...");
  
  // Test Firebase connection
  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/status.json";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Send initial status
  StaticJsonDocument<200> doc;
  doc["status"] = "online";
  doc["lastSeen"] = millis();
  doc["ipAddress"] = WiFi.localIP().toString();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.PUT(jsonString);
  
  if (httpResponseCode > 0) {
    Serial.println("✅ Firebase connection successful!");
    Serial.print("📡 Response code: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.println("❌ Firebase connection failed!");
    Serial.print("📡 Error code: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

// ============================================================================
// SENSOR READING FUNCTIONS
// ============================================================================

void readAllSensors() {
  // Read soil moisture (0-4095, higher = drier)
  int soilMoistureRaw = analogRead(SOIL_MOISTURE_PIN);
  // Convert to percentage (calibrated values: 1465 = wet, 2910 = dry)
  currentData.soilMoisture = map(soilMoistureRaw, 2910, 1465, 0, 100);
  currentData.soilMoisture = constrain(currentData.soilMoisture, 0, 100);
  
  // Read DHT11 (Air temperature and humidity)
  currentData.airTemp = dht.readTemperature();
  currentData.airHumidity = dht.readHumidity();
  
  // Check if DHT reading failed
  if (isnan(currentData.airTemp) || isnan(currentData.airHumidity)) {
    Serial.println("⚠️ DHT11 reading failed!");
    currentData.airTemp = 0;
    currentData.airHumidity = 0;
  }
  
  // Read DS18B20 (Soil temperature)
  soilTempSensor.requestTemperatures();
  currentData.soilTemp = soilTempSensor.getTempCByIndex(0);
  
  // Check if DS18B20 reading failed
  if (currentData.soilTemp == DEVICE_DISCONNECTED_C) {
    Serial.println("⚠️ DS18B20 reading failed!");
    currentData.soilTemp = 0;
  }
  
  // Read MQ135 (Air quality)
  int mq135Raw = analogRead(MQ135_PIN);
  // Convert to PPM (rough approximation)
  currentData.airQuality = map(mq135Raw, 0, 4095, 0, 1000);
  
  // Read rain sensor (0-4095, higher = more rain)
  int rainRaw = analogRead(RAIN_PIN);
  currentData.rainLevel = map(rainRaw, 0, 4095, 0, 100);
  
  // Read LDR (Light sensor) - Analog reading
  int ldrRaw = analogRead(LDR_PIN);
  currentData.lightLevel = map(ldrRaw, 0, 4095, 0, 100); // Convert to percentage
  
  // Get current pump status
  currentData.pumpStatus = !digitalRead(PUMP_RELAY_PIN); // Relay is active LOW
  
  // Set timestamp
  currentData.timestamp = millis();
  
  // Print sensor readings to Serial
  printSensorData();
}

void printSensorData() {
  Serial.println("📊 Sensor Readings:");
  Serial.print("  💧 Soil Moisture: ");
  Serial.print(currentData.soilMoisture, 1);
  Serial.println("%");
  
  Serial.print("  🌡️ Air Temperature: ");
  Serial.print(currentData.airTemp, 1);
  Serial.println("°C");
  
  Serial.print("  💨 Air Humidity: ");
  Serial.print(currentData.airHumidity, 1);
  Serial.println("%");
  
  Serial.print("  🌡️ Soil Temperature: ");
  Serial.print(currentData.soilTemp, 1);
  Serial.println("°C");
  
  Serial.print("  🌫️ Air Quality: ");
  Serial.print(currentData.airQuality, 0);
  Serial.println(" PPM");
  
  Serial.print("  🌧️ Rain Level: ");
  Serial.print(currentData.rainLevel, 1);
  Serial.println("%");
  
  Serial.print("  ☀️ Light Level: ");
  Serial.print(currentData.lightLevel, 1);
  Serial.println("%");
  
  Serial.print("  💧 Pump Status: ");
  Serial.println(currentData.pumpStatus ? "ON" : "OFF");
  
  Serial.println("---");
}

// ============================================================================
// FIREBASE DATA SENDING
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
  
  StaticJsonDocument<500> latestDoc;
  latestDoc["soilMoisture"] = currentData.soilMoisture;
  latestDoc["airTemp"] = currentData.airTemp;
  latestDoc["airHumidity"] = currentData.airHumidity;
  latestDoc["soilTemp"] = currentData.soilTemp;
  latestDoc["gasLevel"] = currentData.airQuality;
  latestDoc["rain"] = currentData.rainLevel;
  latestDoc["light"] = currentData.lightLevel;
  latestDoc["pumpStatus"] = currentData.pumpStatus;
  latestDoc["timestamp"] = currentData.timestamp;
  
  String latestJson;
  serializeJson(latestDoc, latestJson);
  
  int latestResponse = http.PUT(latestJson);
  http.end();
  
  // Send to history (with timestamp as key)
  String historyUrl = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/sensors/history/" + String(currentData.timestamp) + ".json";
  http.begin(historyUrl);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<500> historyDoc;
  historyDoc["soilMoisture"] = currentData.soilMoisture;
  historyDoc["airTemp"] = currentData.airTemp;
  historyDoc["airHumidity"] = currentData.airHumidity;
  historyDoc["soilTemp"] = currentData.soilTemp;
  historyDoc["gasLevel"] = currentData.airQuality;
  historyDoc["rain"] = currentData.rainLevel;
  historyDoc["light"] = currentData.lightLevel;
  historyDoc["pumpStatus"] = currentData.pumpStatus;
  historyDoc["timestamp"] = currentData.timestamp;
  
  String historyJson;
  serializeJson(historyDoc, historyJson);
  
  int historyResponse = http.PUT(historyJson);
  http.end();
  
  // Update device status
  String statusUrl = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/status.json";
  http.begin(statusUrl);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<200> statusDoc;
  statusDoc["status"] = "online";
  statusDoc["lastSeen"] = currentData.timestamp;
  statusDoc["ipAddress"] = WiFi.localIP().toString();
  statusDoc["freeHeap"] = ESP.getFreeHeap();
  
  String statusJson;
  serializeJson(statusDoc, statusJson);
  
  int statusResponse = http.PUT(statusJson);
  http.end();
  
  // Print results
  if (latestResponse > 0 && historyResponse > 0 && statusResponse > 0) {
    Serial.println("✅ Data sent to Firebase successfully!");
  } else {
    Serial.println("❌ Failed to send data to Firebase!");
    Serial.print("Latest: ");
    Serial.print(latestResponse);
    Serial.print(", History: ");
    Serial.print(historyResponse);
    Serial.print(", Status: ");
    Serial.println(statusResponse);
  }
}

// ============================================================================
// CONTROL COMMAND HANDLING
// ============================================================================

void checkForControlCommands() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/control/pump.json";
  
  http.begin(url);
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    http.end();
    
    if (response != "null" && response.length() > 0) {
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, response);
      
      if (!error) {
        String command = doc["command"];
        String reason = doc["reason"];
        unsigned long requestedAt = doc["requestedAt"];
        
        Serial.println("🎛️ Received pump command: " + command);
        Serial.println("📝 Reason: " + reason);
        
        // Execute the command
        if (command == "ON") {
          digitalWrite(PUMP_RELAY_PIN, LOW); // Relay is active LOW
          Serial.println("💧 Pump turned ON");
        } else if (command == "OFF") {
          digitalWrite(PUMP_RELAY_PIN, HIGH); // Relay is active LOW
          Serial.println("💧 Pump turned OFF");
        }
        
        // Clear the command after execution
        clearControlCommand();
      }
    }
  } else {
    http.end();
  }
}

void clearControlCommand() {
  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/control/pump.json";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.sendRequest("DELETE");
  http.end();
  
  Serial.println("🧹 Control command cleared");
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

void printWiFiStatus() {
  Serial.println("📶 WiFi Status:");
  Serial.print("  SSID: ");
  Serial.println(WiFi.SSID());
  Serial.print("  IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("  Signal Strength: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
  Serial.print("  MAC Address: ");
  Serial.println(WiFi.macAddress());
}

void printSystemInfo() {
  Serial.println("💻 System Info:");
  Serial.print("  Free Heap: ");
  Serial.print(ESP.getFreeHeap());
  Serial.println(" bytes");
  Serial.print("  Chip Model: ");
  Serial.println(ESP.getChipModel());
  Serial.print("  Chip Revision: ");
  Serial.println(ESP.getChipRevision());
  Serial.print("  CPU Frequency: ");
  Serial.print(ESP.getCpuFreqMHz());
  Serial.println(" MHz");
  Serial.print("  Flash Size: ");
  Serial.print(ESP.getFlashChipSize() / 1024 / 1024);
  Serial.println(" MB");
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

void handleError(String error) {
  Serial.println("❌ Error: " + error);
  
  // Send error to Firebase
  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/errors.json";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<300> doc;
  doc["error"] = error;
  doc["timestamp"] = millis();
  doc["freeHeap"] = ESP.getFreeHeap();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  http.POST(jsonString);
  http.end();
}

// ============================================================================
// WATCHDOG AND RECOVERY
// ============================================================================

void checkSystemHealth() {
  // Check if we have enough free heap
  if (ESP.getFreeHeap() < 10000) {
    Serial.println("⚠️ Low memory warning!");
    handleError("Low memory: " + String(ESP.getFreeHeap()) + " bytes free");
  }
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi disconnected, attempting reconnection...");
    connectToWiFi();
  }
}

// ============================================================================
// SELF-TEST MODE
// ============================================================================

void runSelfTest() {
  Serial.println("🧪 Running Self-Test Mode...");
  Serial.println("=====================================");
  
  // Test all sensors
  Serial.println("📊 Testing all sensors...");
  
  // Test soil moisture
  int soilRaw = analogRead(SOIL_MOISTURE_PIN);
  float soilMoisture = map(soilRaw, 2910, 1465, 0, 100);
  soilMoisture = constrain(soilMoisture, 0, 100);
  Serial.print("  💧 Soil Moisture: ");
  Serial.print(soilMoisture, 1);
  Serial.println("% (Raw: " + String(soilRaw) + ")");
  
  // Test DHT11
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  if (isnan(temp) || isnan(humidity)) {
    Serial.println("  ❌ DHT11: FAILED - Check wiring");
  } else {
    Serial.print("  ✅ DHT11: Temp=");
    Serial.print(temp, 1);
    Serial.print("°C, Humidity=");
    Serial.print(humidity, 1);
    Serial.println("%");
  }
  
  // Test DS18B20
  soilTempSensor.requestTemperatures();
  float soilTemp = soilTempSensor.getTempCByIndex(0);
  if (soilTemp == DEVICE_DISCONNECTED_C) {
    Serial.println("  ❌ DS18B20: FAILED - Check wiring and pull-up resistor");
  } else {
    Serial.print("  ✅ DS18B20: Soil Temp=");
    Serial.print(soilTemp, 1);
    Serial.println("°C");
  }
  
  // Test MQ135
  int mq135Raw = analogRead(MQ135_PIN);
  float airQuality = map(mq135Raw, 0, 4095, 0, 1000);
  Serial.print("  ✅ MQ135: Air Quality=");
  Serial.print(airQuality, 0);
  Serial.println(" PPM (Raw: " + String(mq135Raw) + ")");
  
  // Test Rain Sensor
  int rainRaw = analogRead(RAIN_PIN);
  float rainLevel = map(rainRaw, 0, 4095, 0, 100);
  Serial.print("  ✅ Rain Sensor: ");
  Serial.print(rainLevel, 1);
  Serial.println("% (Raw: " + String(rainRaw) + ")");
  
  // Test LDR
  int ldrRaw = analogRead(LDR_PIN);
  float lightLevel = map(ldrRaw, 0, 4095, 0, 100);
  Serial.print("  ✅ LDR: Light Level=");
  Serial.print(lightLevel, 1);
  Serial.println("% (Raw: " + String(ldrRaw) + ")");
  
  // Test Relay
  Serial.println("  🔧 Testing Pump Relay...");
  digitalWrite(PUMP_RELAY_PIN, LOW); // Turn ON
  delay(1000);
  bool pumpOn = !digitalRead(PUMP_RELAY_PIN);
  Serial.print("    Pump ON: ");
  Serial.println(pumpOn ? "✅ SUCCESS" : "❌ FAILED");
  
  digitalWrite(PUMP_RELAY_PIN, HIGH); // Turn OFF
  delay(1000);
  bool pumpOff = !digitalRead(PUMP_RELAY_PIN);
  Serial.print("    Pump OFF: ");
  Serial.println(!pumpOff ? "✅ SUCCESS" : "❌ FAILED");
  
  Serial.println("=====================================");
  Serial.println("🧪 Self-Test Complete!");
  Serial.println();
}

// ============================================================================
// SMART IRRIGATION LOGIC
// ============================================================================

void checkSmartIrrigation() {
  // Smart irrigation threshold
  const float MOISTURE_THRESHOLD = 30.0; // 30% soil moisture threshold
  
  // Check if soil moisture is below threshold
  if (currentData.soilMoisture < MOISTURE_THRESHOLD && !currentData.pumpStatus) {
    Serial.println("🌱 Smart Irrigation: Soil moisture low (" + String(currentData.soilMoisture, 1) + "%), starting pump");
    
    // Turn on pump
    digitalWrite(PUMP_RELAY_PIN, LOW); // Relay is active LOW
    currentData.pumpStatus = true;
    
    // Send irrigation event to Firebase
    sendIrrigationEvent("AUTO_START", "Soil moisture below threshold");
    
  } else if (currentData.soilMoisture >= (MOISTURE_THRESHOLD + 10) && currentData.pumpStatus) {
    Serial.println("🌱 Smart Irrigation: Soil moisture adequate (" + String(currentData.soilMoisture, 1) + "%), stopping pump");
    
    // Turn off pump
    digitalWrite(PUMP_RELAY_PIN, HIGH); // Relay is active LOW
    currentData.pumpStatus = false;
    
    // Send irrigation event to Firebase
    sendIrrigationEvent("AUTO_STOP", "Soil moisture adequate");
  }
}

void sendIrrigationEvent(String event, String reason) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/irrigation/events.json";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<300> doc;
  doc["event"] = event;
  doc["reason"] = reason;
  doc["soilMoisture"] = currentData.soilMoisture;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  http.end();
  
  if (httpResponseCode > 0) {
    Serial.println("✅ Irrigation event sent to Firebase");
  } else {
    Serial.println("❌ Failed to send irrigation event to Firebase");
  }
}

// ============================================================================
// END OF CODE
// ============================================================================