# ESP32 classroom scanner

The board does two jobs at once (`WIFI_AP_STA` mode):

1. **Access point**: it hosts the classroom WiFi (`CLASSROOM_SSID`) that students' phones join.
2. **Station**: it joins the school's internet WiFi and reports to the server.

Every `SCAN_INTERVAL_MS` (default 30 s), it reads the MACs of connected phones (`esp_wifi_ap_get_sta_list`) and posts them:

```http
POST /api/wifi/mark-attendance
x-device-key: <DEVICE_API_KEY>
Content-Type: application/json

{ "deviceId": "room-101", "macAddresses": ["AA:BB:CC:DD:EE:FF"] }
```

The server works out which lecture is running, so the board needs no schedule or student data.

## Flash it

1. Install the **ESP32 board package** in the Arduino IDE (Boards Manager → "esp32" by Espressif).
2. Copy `config.example.h` to `config.h` and fill in the WiFi details, `SERVER_URL` and `DEVICE_API_KEY`. The key must match the server's `.env`.
3. Open `esp32-attendance.ino`, select your board (e.g. *ESP32 Dev Module*), and upload.
4. Open the Serial Monitor at 115200 baud. You should see `[scan] N phone(s) -> HTTP 200`.

## Notes and limitations

- **Private MAC addresses.** Android 10+ and iOS 14+ use a different random MAC for each network. Students must register the address shown in their phone's details **for the classroom network**.
- **Capacity.** The ESP32 SoftAP accepts at most 10 stations. Larger rooms need several boards (each with its own `DEVICE_ID`) or a different design: promiscuous-mode probe sniffing, or reading DHCP leases from the school's access points.
- **TLS.** The sketch uses `setInsecure()` for simplicity. Pin the server's root CA with `setCACert()` for production.
- **No hardware?** Run `npm run simulate`. It sends the same request from your computer.
