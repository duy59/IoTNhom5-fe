#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include "DHT.h"
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ESP32Servo.h>

// Define WiFi credentials
#define WIFI_SSID "Duybeos"
#define WIFI_PASSWORD "vuquangduy"

// Define sensor and actuator pins
#define LED_PIN 19    
#define FAN_PIN 18    
#define MIST_PIN 21   
#define LDR_PIN 34
#define DHT_PIN 4
#define SERVO_PIN 13  

// Define timing constants
#define ROTATION_INTERVAL 7200000  // 2 tiếng (ms)
#define ROTATION_DURATION 300000   // 5 phút (ms)
#define ROTATION_PAUSE 10000       // 10 giây (ms)
#define PHOTO_INTERVAL 3600000     // 1 giờ (ms)
#define SENSOR_UPDATE_INTERVAL 5000 // 5 giây (ms)

// Define other constants
#define maxLux 500
#define DHTTYPE DHT11

// Firebase credentials
#define API_KEY "AIzaSyAUmPWMOmENxc3AiwojQvCCMj7HBKWafC4"
#define DATABASE_URL "https://appfirebase1-d1c0a-default-rtdb.asia-southeast1.firebasedatabase.app/"

// Initialize objects
DHT dht(DHT_PIN, DHTTYPE);
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
FirebaseData fbdoFirestore;
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 7 * 3600, 60000);
Servo sg90;

// Timing variables
unsigned long lastSensorUpdate = 0;
unsigned long lastRotationTime = 0;
unsigned long lastPhotoTime = 0;
bool signupOK = false;
bool isRotating = false;

// Sensor data variables
float temperature = 0.0;
float humidity = 0.0;
int ldrData = 0;

// Servo control variables
bool servoEnabled = true;
bool spinDirection = false;

// Hatch cycle structure
struct HatchCycle {
  bool isActive;
  String cycleId;
  String eggType;
  int dayCount;
  unsigned long startTime;
} currentCycle;

// Project ID variable
String projectID;

// Token status callback
void tokenStatusCallback(firebase_auth_token_info_t info) {
  if (info.status == token_status_error) {
    Serial.printf("Token error: %s\n", info.error.message.c_str());
  }
}

void setup() {
  Serial.begin(115200);

  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(MIST_PIN, OUTPUT);

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nConnected with IP: " + WiFi.localIP().toString());

  // Initialize sensors
  dht.begin();

  // Initialize servo
  sg90.setPeriodHertz(50);
  sg90.attach(SERVO_PIN, 500, 2400);
  
  // Extract project ID
  String url = DATABASE_URL;
  int startIndex = url.indexOf("https://") + 8;
  int endIndex = url.indexOf("-default-rtdb");
  projectID = url.substring(startIndex, endIndex);

  // Configure Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase signup OK");
    signupOK = true;
  } else {
    Serial.printf("Firebase signup failed: %s\n", config.signer.signupError.message.c_str());
  }

  // Initialize NTP
  timeClient.begin();
  while(!timeClient.update()) {
    timeClient.forceUpdate();
    delay(500);
  }
  Serial.println("NTP synchronized");

  // Initialize hatch cycle
  initializeHatchCycle();
}
void loop() {
  timeClient.update();
  
  if (Firebase.ready() && signupOK) {
    unsigned long currentTime = millis();

    // Cập nhật cảm biến và gửi dữ liệu lên Firebase
    if (currentTime - lastSensorUpdate >= SENSOR_UPDATE_INTERVAL) {
      updateSensorData();
      lastSensorUpdate = currentTime;
    }

    // Kiểm tra và thực hiện quay trứng
    if (servoEnabled && !isRotating && (currentTime - lastRotationTime >= ROTATION_INTERVAL)) {
      performEggRotation();
    }

    // Kiểm tra và chụp ảnh
    if (currentCycle.isActive && (currentTime - lastPhotoTime >= PHOTO_INTERVAL)) {
      capturePhoto();
      lastPhotoTime = currentTime;
    }

    // Kiểm tra và cập nhật trạng thái thiết bị
    updateDeviceStates();
  }

  delay(100);
}

void initializeHatchCycle() {
  if (Firebase.RTDB.getString(&fbdo, "currentCycle/id")) {
    currentCycle.isActive = true;
    currentCycle.cycleId = fbdo.stringData();
    
    if (Firebase.RTDB.getString(&fbdo, "currentCycle/eggType")) {
      currentCycle.eggType = fbdo.stringData();
      currentCycle.startTime = timeClient.getEpochTime();
      currentCycle.dayCount = 0;
      
      Serial.println("Hatch cycle initialized: " + currentCycle.cycleId);
    }
  } else {
    currentCycle.isActive = false;
    Serial.println("No active hatch cycle found");
  }
}

void updateSensorData() {
  // Đọc dữ liệu cảm biến
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();
  ldrData = analogRead(LDR_PIN);
  float voltage = ldrData * (3.3 / 4095.0);
  float lux = 500 - (voltage / 3.3) * maxLux;

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("DHT sensor read failed!");
    return;
  }

  // Cập nhật lên Realtime Database
  Firebase.RTDB.setFloat(&fbdo, "Sensor/temperature", temperature);
  Firebase.RTDB.setFloat(&fbdo, "Sensor/humidity", humidity);
  Firebase.RTDB.setFloat(&fbdo, "Sensor/lux", lux);

  // Tạo timestamp
  time_t epochTime = timeClient.getEpochTime();
  struct tm *timeInfo = localtime(&epochTime);
  char timestamp[30];
  snprintf(timestamp, sizeof(timestamp), "%04d-%02d-%02dT%02d:%02d:%02d+07:00",
           timeInfo->tm_year + 1900, timeInfo->tm_mon + 1, timeInfo->tm_mday,
           timeInfo->tm_hour, timeInfo->tm_min, timeInfo->tm_sec);

  // Cập nhật lên Firestore
  FirebaseJson json;
  json.set("fields/temperature/doubleValue", temperature);
  json.set("fields/humidity/doubleValue", humidity);
  json.set("fields/lux/doubleValue", lux);
  json.set("fields/timestamp/timestampValue", timestamp);

  if (currentCycle.isActive) {
    int daysPassed = (epochTime - currentCycle.startTime) / 86400;
    if (daysPassed != currentCycle.dayCount) {
      currentCycle.dayCount = daysPassed;
      String path = "cycles/" + currentCycle.cycleId + "/days/" + String(daysPassed);
      
      FirebaseJson dailyData;
      dailyData.set("temperature", temperature);
      dailyData.set("humidity", humidity);
      dailyData.set("lux", lux);
      dailyData.set("timestamp", timestamp);
      
      Firebase.RTDB.setJSON(&fbdo, path.c_str(), &dailyData);
    }
  }

  Firebase.Firestore.createDocument(&fbdoFirestore, projectID.c_str(), "", "SensorData", "", json.raw(), "");
}

void performEggRotation() {
  isRotating = true;
  Serial.println("Starting egg rotation...");

  // Quay servo từ 0 đến 180 độ
  for (int pos = 0; pos <= 180; pos++) {
    sg90.write(pos);
    delay(50);
  }

  // Đợi trong thời gian ROTATION_DURATION (5 phút)
  delay(ROTATION_DURATION);

  // Quay ngược lại từ 180 đến 0 độ
  for (int pos = 180; pos >= 0; pos--) {
    sg90.write(pos);
    delay(50);
  }

  // Đợi ROTATION_PAUSE (10 giây) trước khi kết thúc
  delay(ROTATION_PAUSE);

  isRotating = false;
  lastRotationTime = millis();

  // Cập nhật thời gian quay cuối cùng lên Firebase
  Firebase.RTDB.setInt(&fbdo, "servo/lastRotation", timeClient.getEpochTime());
  Serial.println("Egg rotation completed");
}

void capturePhoto() {
  Firebase.RTDB.setBool(&fbdo, "capture/command", true);
  Serial.println("Photo capture triggered");
  lastPhotoTime = millis();
}

void updateDeviceStates() {
  // Đọc và cập nhật trạng thái LED
  if (Firebase.RTDB.getBool(&fbdo, "devices/LED/state")) {
    digitalWrite(LED_PIN, fbdo.boolData() ? HIGH : LOW);
  }

  // Đọc và cập nhật trạng thái FAN
  if (Firebase.RTDB.getBool(&fbdo, "devices/FAN/state")) {
    digitalWrite(FAN_PIN, fbdo.boolData() ? HIGH : LOW);
  }

  // Đọc và cập nhật trạng thái Mist
  if (Firebase.RTDB.getBool(&fbdo, "devices/Mist/state")) {
    digitalWrite(MIST_PIN, fbdo.boolData() ? HIGH : LOW);
  }

  // Đọc trạng thái servo
  if (Firebase.RTDB.getBool(&fbdo, "servo/enabled")) {
    servoEnabled = fbdo.boolData();
  }
}