/*
 * SmartAgro ESP32 Production Firmware - Firebase Control Fixed
 * 
 * Fixes:
 * - Added Firebase command reading for relay control
 * - React app button now controls relay instantly
 * - Maintains all existing functionality
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
 
 // Pin Definitions
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
 #define RAIN_THRESHOLD 3000   // >3800 = Dry (No rain), <3000 = Rain
 #define LDR_THRESHOLD 500
 
 // Timing
 #define SENSOR_READ_INTERVAL 5000
 #define RELAY_CHECK_INTERVAL 200
 #define FIREBASE_CONTROL_CHECK_INTERVAL 1000  // Check Firebase commands every 1 second
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
 bool relayActiveLow = true;
 
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
 
 // ============================================================================
 // SETUP
 // ============================================================================
 void setup() {
   Serial.begin(115200);
   Serial.println("🌱 SmartAgro ESP32 Starting...");
 
   pinMode(RELAY_PIN, OUTPUT);
   pinMode(LDR_PIN, INPUT);
   pinMode(RAIN_SENSOR_PIN, INPUT);
   pinMode(SOIL_MOISTURE_PIN, INPUT);
   pinMode(MQ135_PIN, INPUT);
 
   digitalWrite(RELAY_PIN, HIGH); // Start OFF (Active LOW relay)
 
   dht.begin();
   soilTempSensor.begin();
 
   controlData.irrigationMode = "manual";
   controlData.relayStatus = "off";
   controlData.lastFirebaseRelayCommand = "off";
   controlData.thresholds.soilMoistureLow = 10;
   controlData.thresholds.soilMoistureHigh = 30;
 
   connectToWiFi();
   Serial.println("✅ SmartAgro ESP32 Ready!");
   Serial.println("💡 Send 'ON' or 'OFF' via Serial, or use React app buttons");
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
 
   // Reconnect WiFi if needed
   if (WiFi.status() != WL_CONNECTED) {
     connectToWiFi();
     return;
   }
 
   // Read sensors and send data
   if (currentTime - lastSensorRead >= SENSOR_READ_INTERVAL) {
     readAllSensors();
     sendSensorData();
     lastSensorRead = currentTime;
   }
 }
 
 // ============================================================================
 // WIFI
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
     Serial.println("❌ WiFi failed");
   }
 }
 
 // ============================================================================
 // SENSOR FUNCTIONS
 // ============================================================================
 void readAllSensors() {
   currentData.soilMoistureRaw = analogRead(SOIL_MOISTURE_PIN);
   currentData.soilMoisturePct = map(currentData.soilMoistureRaw, SOIL_MOISTURE_DRY, SOIL_MOISTURE_WET, 0, 100);
   currentData.soilMoisturePct = constrain(currentData.soilMoisturePct, 0, 100);
 
   currentData.airTemperature = dht.readTemperature();
   currentData.airHumidity = dht.readHumidity();
 
   soilTempSensor.requestTemperatures();
   currentData.soilTemperature = soilTempSensor.getTempCByIndex(0);
 
   currentData.airQualityIndex = analogRead(MQ135_PIN);
   currentData.gases.co2 = map(currentData.airQualityIndex, 0, 4095, 300, 1000);
   currentData.gases.nh3 = map(currentData.airQualityIndex, 0, 4095, 0, 50);
 
   currentData.lightDetected = digitalRead(LDR_PIN);
 
   // Rain Sensor Calibration
   currentData.rainLevelRaw = analogRead(RAIN_SENSOR_PIN);
   if (currentData.rainLevelRaw > 3800) {
     currentData.rainStatus = "No Rain";
   } else if (currentData.rainLevelRaw < RAIN_THRESHOLD) {
     currentData.rainStatus = "Rain Detected";
   } else {
     currentData.rainStatus = "Drying";
   }
 
   currentData.relayStatus = controlData.relayStatus;
   currentData.timestamp = millis();
 
   Serial.println("📊 Soil: " + String(currentData.soilMoisturePct) + "% | Rain: " + currentData.rainStatus + " (" + String(currentData.rainLevelRaw) + ")");
   Serial.println("💧 Relay: " + currentData.relayStatus);
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
     digitalWrite(RELAY_PIN, LOW);  // Active LOW
     controlData.relayStatus = "on";
     Serial.println("💧 Pump ON");
   } else {
     digitalWrite(RELAY_PIN, HIGH);
     controlData.relayStatus = "off";
     Serial.println("💧 Pump OFF");
   }
   delay(100);
   int pinState = digitalRead(RELAY_PIN);
   Serial.println("🔍 Relay GPIO14 state = " + String(pinState));
 }
 
 void updateFirebaseControlStatus(String status) {
   if (WiFi.status() != WL_CONNECTED) return;
   
   HTTPClient http;
   String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/controls/relayStatus.json";
   
   http.begin(url);
   http.addHeader("Content-Type", "application/json");
   
   String payload = "\"" + status + "\"";
   int response = http.PUT(payload);
   http.end();
   
   Serial.println(response == 200 ? "✅ Status updated to Firebase" : "❌ Firebase update failed");
 }
 
 // ============================================================================
 // FIREBASE SEND (Enhanced)
 // ============================================================================
 void sendSensorData() {
   if (WiFi.status() != WL_CONNECTED) return;
 
   HTTPClient http;
   String url = String(FIREBASE_HOST) + "/devices/" + DEVICE_ID + "/sensors/latest.json";
   http.begin(url);
   http.addHeader("Content-Type", "application/json");
   http.setTimeout(FIREBASE_TIMEOUT);
 
   StaticJsonDocument<500> doc;
   doc["soilMoistureRaw"] = currentData.soilMoistureRaw;
   doc["soilMoisturePct"] = currentData.soilMoisturePct;
   doc["airTemperature"] = currentData.airTemperature;
   doc["airHumidity"] = currentData.airHumidity;
   doc["soilTemperature"] = currentData.soilTemperature;
   doc["airQualityIndex"] = currentData.airQualityIndex;
   doc["lightDetected"] = currentData.lightDetected;
   doc["rainLevelRaw"] = currentData.rainLevelRaw;
   doc["rainStatus"] = currentData.rainStatus;
   doc["relayStatus"] = currentData.relayStatus;
   doc["timestamp"] = currentData.timestamp;
 
   String payload;
   serializeJson(doc, payload);
   int response = http.PUT(payload);
   http.end();
 
   Serial.println(response == 200 ? "✅ Data sent" : "❌ Send failed (" + String(response) + ")");
 }