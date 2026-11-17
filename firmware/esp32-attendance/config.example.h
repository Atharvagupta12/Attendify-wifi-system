// Copy this file to config.h (git-ignored) and fill in your values.
#pragma once

// Classroom access point that students' phones connect to
#define CLASSROOM_SSID      "Attendify-Room-101"
#define CLASSROOM_PASSWORD  "change-me-123"   // at least 8 characters
#define MAX_STUDENTS        10                // ESP32 SoftAP supports up to 10 stations

// Uplink network with internet access (to reach the server)
#define UPLINK_SSID         "School-WiFi"
#define UPLINK_PASSWORD     "school-password"

// Attendify server
#define SERVER_URL          "https://your-app.vercel.app"   // no trailing slash
#define DEVICE_API_KEY      "same-value-as-DEVICE_API_KEY-on-the-server"
#define DEVICE_ID           "room-101"

// How often to report connected phones
#define SCAN_INTERVAL_MS    30000
