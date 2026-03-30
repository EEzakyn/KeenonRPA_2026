#include <WiFi.h>

const char* ssid = "Wifi_name";  // Wifi name
const char* password = "Password"; // Wifi password

// config ESP32 static ip 
IPAddress local_IP(192, 168, 1, 115); // ESP32 IP
IPAddress gateway(192, 168, 1, 1);   // IP gateway
IPAddress subnet(255, 255, 255, 0);  // subnet

const char* server_ip = "192.168.1.101"; // Robot Server IP
const uint16_t server_port = 9999;       // Node-red Port

WiFiClient client;
unsigned long lastReconnectAttempt = 0;

void setup() {
  Serial.begin(115200);

  WiFi.disconnect(true); 
  WiFi.mode(WIFI_OFF);
  delay(1000);

  connectWiFi();
   pinMode(2, OUTPUT);
  digitalWrite(2, 1);
}

void loop() {
  if(WiFi.status() != WL_CONNECTED){    // check WiFi connection
    Serial.println("WiFi Disconnected! Trying to reconnect...");
    connectWiFi();
  }

  if(!client.connected()){      // check TCP connection
    unsigned long now = millis();
    if(now - lastReconnectAttempt > 8000){
      lastReconnectAttempt = now;
      Serial.println("try to connect to TCP Server....");

      if(client.connect(server_ip,server_port)){
        Serial.println("Connected Successfully.");
      }
      else{
        Serial.println("Connected Fail... wait for 5 senconds."); 
        digitalWrite(2, 1);
       }
    }
  }

  else{
    if(client.available()){
      String request = client.readStringUntil('\n'); // read Command that sent from Node-red
      request.trim();

      if(request.length()>0){ // process command to on/off charge
        Serial.println("response:" + request);
        process_Comand(request);
      }
    }
  }
  delay(500);
}

void connectWiFi(){
  WiFi.disconnect(true);
  Serial.println("Connection to WiFi....");

  WiFi.mode(WIFI_STA);
  delay(100);

  if(!WiFi.config(local_IP,gateway,subnet)){
    Serial.println("STA Failed to configure Static IP");
  }

  //Serial.println(ssid);
  
  WiFi.begin(ssid,password);

  while (WiFi.status() != WL_CONNECTED){
    delay(500);
    Serial.print(".");
  }
  Serial.println("!!! Connection to WiFi Success !!!");
  Serial.print("ESP32 Static IP: ");
  Serial.println(WiFi.localIP());
}

void process_Comand(String cmd){
  Serial.println("Received: " + cmd);

  // เช็คว่าคำสั่งขึ้นต้นด้วย "command:" หรือไม่
  if(cmd.startsWith("command:")){
    
    // หาตำแหน่งของเครื่องหมาย ':' ทั้งสองตัว
    int firstColonIndex = cmd.indexOf(':');
    int secondColonIndex = cmd.indexOf(':', firstColonIndex + 1);

    // ตรวจสอบว่ารูปแบบถูกต้อง (มี ':' ครบ 2 ตัว)
    if(firstColonIndex != -1 && secondColonIndex != -1){
      
      // หั่นข้อความเพื่อเอาค่า Pin (ตัวที่อยู่ระหว่าง : ตัวแรก กับ ตัวที่สอง)
      String pinString = cmd.substring(firstColonIndex + 1, secondColonIndex);
      
      // หั่นข้อความเพื่อเอาค่า Status (ตัวที่อยู่หลัง : ตัวที่สอง ไปจนจบประโยค)
      String statusString = cmd.substring(secondColonIndex + 1);

      // แปลงเป็นตัวเลข
      int pinNumber = pinString.toInt();
      int pinStatus = statusString.toInt();

      // สั่งงานบอร์ด ESP32
      pinMode(pinNumber, OUTPUT);
      digitalWrite(pinNumber, pinStatus);

      // --- สร้างข้อความตอบกลับ ---
      // เอา String เดิมมาประกอบร่างใหม่เป็นรูปแบบ response:xx:y
      String reply = "response:" + pinString + ":" + statusString;
      
      // ส่งกลับไปที่ Node-RED
      client.println(reply);
      Serial.println("Executed & Replied: " + reply);
      
    } else {
      Serial.println("Error: Invalid command format (missing colon).");
    }
  } else {
    Serial.println("Error: Unknown command header.");
  }
}
