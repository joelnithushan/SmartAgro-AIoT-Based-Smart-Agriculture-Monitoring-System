/*
 * SmartAgro ESP32 Production Firmware - Complete Dashboard Integration
 * 
 * Features:
 * - Complete sensor data for all dashboard charts and graphs
 * - Gas sensors (CO2, NH3) for proper gas level display
 * - Real-time Firebase integration
 * - Relay control via dashboard buttons
 * - All sensor readings for comprehensive monitoring
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

// WiFi Configuration - CHANGE THESE TO YOUR NETWORK
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Firebase Configuration
const char* FIREBASE_HOST = "https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app";
const char* DEVICE_ID = "ESP32_001"; // Change this for each device
const char* FIREBASE_AUTH_TOKEN = ""; // Not needed - using Firebase rules with .write: true

// Pin Definitions
#define SOIL_MOISTURE_PIN 34
#define DHT_PIN 4
#define RELAY_PIN 14  // ACTIVE LOW: LOW = ON, HIGH = OFF (with pull-up resistor)
#define RAIN_SENSOR_PIN 32
#define MQ135_PIN 35
#define LDR_PIN 15
#define DS18B20_PIN 25

// Sensor Configuration
#define DHT_TYPE DHT11
#define SOIL_MOISTURE_DRY 2910
#define SOIL_MOISTURE_WET 1465
#define RAIN_THRESHOLD 3000   // >3800 = Dry (No rain), <3000 = Rain
#define LDR_THRESHOLD 500

// Gas Sensor Configuration
#define MQ135_BASE_CO2 400    // Baseline CO2 in ppm
#define MQ135_BASE_NH3 0      // Baseline NH3 in ppm

// Timing
#define SENSOR_READ_INTERVAL 3000  // Reduced for more real-time updates
#define RELAY_CHECK_INTERVAL 200
#define FIREBASE_CONTROL_CHECK_INTERVAL 1000
#define METADATA_UPDATE_INTERVAL 10000
#define FIREBASE_TIMEOUT 5000

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
DHT dht(DHT_PIN, DHT_TYPE);
OneWire oneWire(DS18B20_PIN);
DallasTemperature soilTempSensor(&oneWire);

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
  String rainStatus;
  String relayStatus;
  unsigned long timestamp;
};

struct ControlData {
  String irrigationMode;
  String relayStatus;
  String lastFirebaseRelayCommand;
  struct {
    int soilMoistureLow;
    int soilMoistureHigh;
  } thresholds;
};

SensorData currentData;
ControlData controlData;
unsigned long lastSensorRead = 0;
unsigned long lastRelayCheck = 0;
unsigned long lastFirebaseControlCheck = 0;
unsigned long lastMetadataUpdate = 0;

// ============================================================================
// FUNCTION DECLARATIONS
// ============================================================================
void connectToWiFi();
void readAllSensors();
void checkInstantRelayControl();
void checkFirebaseCommands();
void controlRelay(String status);
void sendSensorData();
void updateFirebaseControlStatus(String status);
void updateMetadata();
int calculateCO2(int rawValue);
int calculateNH3(int rawValue);

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  Serial.println("🌱 SmartAgro ESP32 Starting...");
  Serial.println("📊 Dashboard Integration Ready");

  // Pin Configuration
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LDR_PIN, INPUT);
  pinMode(RAIN_SENSOR_PIN, INPUT);
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(MQ135_PIN, INPUT);

  // Initialize relay to OFF with internal pull-up for safety
  pinMode(RELAY_PIN, INPUT_PULLUP);  // Enable internal pull-up resistor
  delay(10);  // Brief delay to ensure pull-up is active
  pinMode(RELAY_PIN, OUTPUT);  // Switch to output mode (pull-up remains active)
  digitalWrite(RELAY_PIN, HIGH);  // Relay OFF initially (HIGH = OFF for active low relay)

  // Initialize sensors
  dht.begin();
  soilTempSensor.begin();

  // Initialize control data
  controlData.irrigationMode = "manual";
  controlData.relayStatus = "off";
  controlData.lastFirebaseRelayCommand = "off";
  controlData.thresholds.soilMoistureLow = 10;
  controlData.thresholds.soilMoistureHigh = 30;

  // Initialize sensor data with reasonable defaults
  currentData.airTemperature = 25.0;
  currentData.airHumidity = 50.0;
  currentData.soilTemperature = 23.0;

  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("✅ SmartAgro ESP32 Ready!");
  Serial.println("📈 All sensors active for dashboard monitoring");
  Serial.println("💡 Use dashboard buttons or send 'ON'/'OFF' via Serial");
}

// ============================================================================
// MAIN LOOP
// ============================================================================
void loop() {
  unsigned long currentTime = millis();

  // Check for immediate relay commands (Serial + Firebase)
  if (currentTime - lastRelayCheck >= RELAY_CHECK_INTERVAL) {
    checkInstantRelayControl();
    lastRelayCheck = currentTime;
  }

  // Check Firebase for control commands
  if (currentTime - lastFirebaseControlCheck >= FIREBASE_CONTROL_CHECK_INTERVAL) {
    if (WiFi.status() == WL_CONNECTED) {
      checkFirebaseCommands();
    }
    lastFirebaseControlCheck = currentTime;
  }

  // Update metadata periodically
  if (currentTime - lastMetadataUpdate >= METADATA_UPDATE_INTERVAL) {
    if (WiFi.status() == WL_CONNECTED) {
      updateMetadata();
    }
    lastMetadataUpdate = currentTime;
  }

  // Reconnect WiFi if needed
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    return;
  }

  // Read sensors and send data for dashboard
  if (currentTime - lastSensorRead >= SENSOR_READ_INTERVAL) {
    readAllSensors();
    sendSensorData();
    lastSensorRead = currentTime;
  }
}

// ============================================================================
// WIFI CONNECTION
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
    Serial.println("✅ WiFi connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("❌ WiFi connection failed");
  }
}

// ============================================================================
// SENSOR READING FUNCTIONS
// ============================================================================
void readAllSensors() {
  // Soil Moisture Sensor
  currentData.soilMoistureRaw = analogRead(SOIL_MOISTURE_PIN);
  currentData.soilMoisturePct = map(currentData.soilMoistureRaw, SOIL_MOISTURE_DRY, SOIL_MOISTURE_WET, 0, 100);
  currentData.soilMoisturePct = constrain(currentData.soilMoisturePct, 0, 100);

  // Air Temperature and Humidity (DHT11)
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  
  // Validate DHT readings
  if (!isnan(temp) && temp > -40 && temp < 80) {
    currentData.airTemperature = temp;
  }
  if (!isnan(hum) && hum >= 0 && hum <= 100) {
    currentData.airHumidity = hum;
  }

  // Soil Temperature (DS18B20)
  soilTempSensor.requestTemperatures();
  delay(750); // Wait for temperature conversion
  float soilTemp = soilTempSensor.getTempCByIndex(0);
  if (soilTemp != DEVICE_DISCONNECTED_C && soilTemp > -50 && soilTemp < 100) {
    currentData.soilTemperature = soilTemp;
  } else {
    // If sensor disconnected, use a reasonable default based on air temp
    currentData.soilTemperature = currentData.airTemperature - 2.0;
  }

  // Air Quality and Gas Sensors (MQ135)
  currentData.airQualityIndex = analogRead(MQ135_PIN);
  currentData.gases.co2 = calculateCO2(currentData.airQualityIndex);
  currentData.gases.nh3 = calculateNH3(currentData.airQualityIndex);

  // Light Detection (LDR)
  currentData.lightDetected = digitalRead(LDR_PIN);

  // Rain Sensor
  currentData.rainLevelRaw = analogRead(RAIN_SENSOR_PIN);
  if (currentData.rainLevelRaw > 3800) {
    currentData.rainStatus = "No Rain";
  } else if (currentData.rainLevelRaw < RAIN_THRESHOLD) {
    currentData.rainStatus = "Rain Detected";
  } else {
    currentData.rainStatus = "Drying";
  }

  // Relay Status
  currentData.relayStatus = controlData.relayStatus;
  currentData.timestamp = millis();

  // Serial output for monitoring
  Serial.println("📊 Dashboard Data:");
  Serial.println("   💧 Soil: " + String(currentData.soilMoisturePct) + "% (" + String(currentData.soilMoistureRaw) + ")");
  Serial.println("   🌡️ Air: " + String(currentData.airTemperature, 1) + "°C, " + String(currentData.airHumidity, 1) + "%");
  Serial.println("   🌱 Soil Temp: " + String(currentData.soilTemperature, 2) + "°C");
  Serial.println("   💨 Air Quality: " + String(currentData.airQualityIndex));
  Serial.println("   🧪 CO2: " + String(currentData.gases.co2) + " ppm, NH3: " + String(currentData.gases.nh3) + " ppm");
  Serial.println("   ☀️ Light: " + String(currentData.lightDetected ? "Detected" : "Dark"));
  Serial.println("   🌧️ Rain: " + currentData.rainStatus + " (" + String(currentData.rainLevelRaw) + ")");
  Serial.println("   💧 Relay: " + currentData.relayStatus);
}

// ============================================================================
// GAS SENSOR CALCULATIONS
// ============================================================================
int calculateCO2(int rawValue) {
  // MQ135 CO2 calculation (simplified)
  // In a real scenario, you'd need proper calibration
  float voltage = (rawValue / 4095.0) * 3.3;
  float ratio = voltage / 0.4; // Rs/R0 ratio
  float co2 = 400 * pow(ratio, -2.95); // CO2 in ppm
  return constrain((int)co2, 300, 2000);
}

int calculateNH3(int rawValue) {
  // MQ135 NH3 calculation (simplified)
  float voltage = (rawValue / 4095.0) * 3.3;
  float ratio = voltage / 0.4;
  float nh3 = 10 * pow(ratio, -2.5); // NH3 in ppm
  return constrain((int)nh3, 0, 100);
}

// ============================================================================
// RELAY CONTROL
// ============================================================================
void checkInstantRelayControl() {
  // Serial monitor commands (for testing)
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.equalsIgnoreCase("ON")) {
      controlRelay("on");
      updateFirebaseControlStatus("on");
    } else if (cmd.equalsIgnoreCase("OFF")) {
      controlRelay("off");
      updateFirebaseControlStatus("off");
    }
  }
}

void checkFirebaseCommands() {
  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/controls/relayCommand.json";
  
  http.begin(url);
  http.setTimeout(FIREBASE_TIMEOUT);
  
  // Auth disabled - using Firebase rules with .write: true
  // (Expired token was causing 401 errors)
  
  int httpCode = http.GET();
  
  if (httpCode == HTTP_CODE_OK) {
    String response = http.getString();
    response.trim();
    
    // Remove quotes from JSON string response
    if (response.startsWith("\"") && response.endsWith("\"")) {
      response = response.substring(1, response.length() - 1);
    }
    
    // Only act if command changed
    if (response != controlData.lastFirebaseRelayCommand && (response == "on" || response == "off")) {
      Serial.println("🔥 Firebase Command: " + response);
      controlRelay(response);
      controlData.lastFirebaseRelayCommand = response;
    }
  } else if (httpCode > 0) {
    Serial.println("⚠️ Firebase GET error: " + String(httpCode));
  }
  
  http.end();
}

void controlRelay(String status) {
  if (status == "on") {
    digitalWrite(RELAY_PIN, LOW);  // Active LOW relay - LOW = Pump ON
    controlData.relayStatus = "on";
    Serial.println("💧 Pump ON");
  } else {
    digitalWrite(RELAY_PIN, HIGH);  // Active LOW relay - HIGH = Pump OFF
    controlData.relayStatus = "off";
    Serial.println("💧 Pump OFF");
  }
}

void updateFirebaseControlStatus(String status) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/controls/relayStatus.json";
  
  http.begin(url);
  
  // Auth disabled - using Firebase rules with .write: true
  // (Expired token was causing 401 errors)
  http.addHeader("Content-Type", "application/json");
  
  String payload = "\"" + status + "\"";
  int response = http.PUT(payload);
  http.end();
  
  Serial.println(response == 200 ? "✅ Status updated to Firebase" : "❌ Firebase update failed");
}

// ============================================================================
// FIREBASE DATA SENDING
// ============================================================================
void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/sensors/latest.json";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Auth disabled - using Firebase rules with .write: true
  // (Expired token was causing 401 errors)
  
  http.setTimeout(FIREBASE_TIMEOUT);

  // Create JSON document with all sensor data for dashboard
  StaticJsonDocument<600> doc;
  
  // Primary sensors
  doc["soilMoistureRaw"] = currentData.soilMoistureRaw;
  doc["soilMoisturePct"] = currentData.soilMoisturePct;
  doc["airTemperature"] = currentData.airTemperature;
  doc["airHumidity"] = currentData.airHumidity;
  doc["soilTemperature"] = currentData.soilTemperature;
  doc["airQualityIndex"] = currentData.airQualityIndex;
  
  // Gas sensors (nested object)
  JsonObject gases = doc.createNestedObject("gases");
  gases["co2"] = currentData.gases.co2;
  gases["nh3"] = currentData.gases.nh3;
  
  // Environmental sensors
  doc["lightDetected"] = currentData.lightDetected;
  doc["rainLevelRaw"] = currentData.rainLevelRaw;
  doc["rainStatus"] = currentData.rainStatus;
  doc["relayStatus"] = currentData.relayStatus;
  doc["timestamp"] = currentData.timestamp;

  String payload;
  serializeJson(doc, payload);
  int response = http.PUT(payload);
  http.end();

  if (response == 200) {
    Serial.println("✅ Dashboard data sent successfully");
  } else {
    Serial.println("❌ Dashboard data send failed (" + String(response) + ")");
  }
}

// ============================================================================
// METADATA UPDATES
// ============================================================================
void updateMetadata() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/meta/lastSeen.json";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Auth disabled - using Firebase rules with .write: true
  // (Expired token was causing 401 errors)
  
  String payload = String(millis());
  int response = http.PUT(payload);
  http.end();
  
  if (response == 200) {
    Serial.println("📡 Device online status updated");
  }
}
