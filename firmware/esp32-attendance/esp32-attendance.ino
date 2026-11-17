/*
 * Attendify — ESP32 classroom scanner
 * ------------------------------------
 * Runs in AP+STA mode:
 *   - AP  : broadcasts the classroom WiFi that students' phones join
 *   - STA : connects to the school/internet WiFi to reach the Attendify server
 *
 * Every SCAN_INTERVAL_MS it reads the MAC addresses of the phones connected to
 * its access point and POSTs them to /api/wifi/mark-attendance. The server
 * decides which lecture is in progress and marks those students present, so the
 * board needs no schedule or student data of its own.
 *
 * Board: any ESP32 (Arduino core 2.x / 3.x). No extra libraries required.
 * Setup: copy config.example.h to config.h and fill in your values.
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <esp_wifi.h>
#include "config.h"

static unsigned long lastScan = 0;

static String macToString(const uint8_t *mac) {
  char buf[18];
  snprintf(buf, sizeof(buf), "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(buf);
}

static void connectUplink() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("[uplink] connecting to %s", UPLINK_SSID);
  WiFi.begin(UPLINK_SSID, UPLINK_PASSWORD);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500);
    Serial.print('.');
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? " ok" : " failed (will retry)");
}

/** Build {"deviceId":"...","macAddresses":["AA:..",...]} from stations connected to our AP. */
static int collectStations(String &json) {
  wifi_sta_list_t list;
  memset(&list, 0, sizeof(list));
  if (esp_wifi_ap_get_sta_list(&list) != ESP_OK) return -1;

  json = "{\"deviceId\":\"" DEVICE_ID "\",\"macAddresses\":[";
  for (int i = 0; i < list.num; i++) {
    if (i) json += ',';
    json += '"';
    json += macToString(list.sta[i].mac);
    json += '"';
  }
  json += "]}";
  return list.num;
}

static void report() {
  String body;
  int count = collectStations(body);
  if (count <= 0) {
    Serial.println(count == 0 ? "[scan] no phones connected" : "[scan] failed to read station list");
    return;
  }
  connectUplink();
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure tls;
  // For a production deployment, pin the server's root CA with tls.setCACert(...).
  tls.setInsecure();

  HTTPClient http;
  http.begin(tls, String(SERVER_URL) + "/api/wifi/mark-attendance");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_API_KEY);
  http.setTimeout(10000);

  int status = http.POST(body);
  Serial.printf("[scan] %d phone(s) -> HTTP %d %s\n", count, status, http.getString().c_str());
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\nAttendify scanner " DEVICE_ID);

  WiFi.mode(WIFI_AP_STA);
  // Note: the AP shares the radio with the uplink, so it follows the uplink's channel.
  WiFi.softAP(CLASSROOM_SSID, CLASSROOM_PASSWORD, 1, 0, MAX_STUDENTS);
  Serial.printf("[ap] classroom WiFi \"%s\" up at %s\n", CLASSROOM_SSID, WiFi.softAPIP().toString().c_str());

  connectUplink();
}

void loop() {
  if (millis() - lastScan >= SCAN_INTERVAL_MS || lastScan == 0) {
    lastScan = millis();
    report();
  }
  delay(100);
}
