## Overview

This is a Mongoose OS app for the ESP32 Heltec WifiKit or ESP32 Heltec Lora with OLED.   It should work with other IOT boards connected to a SSD1306 over I2C by changing the `mos.yml` config settings.

It removes the default adafruit logo and allows dynamic bitmap loading via Javascript (just
create a Base64 string with [image converter](https://www.espruino.com/Image+Converter)).

It programs an L298N to move a floor robot

## 1. Install MOS

``` bash
curl -fsSL https://mongoose-os.com/downloads/mos/install.sh | /bin/bash
~/.mos/bin/mos --help      
~/.mos/bin/mos
```

## 2. Reset default firmware on ESP32 (optional)

Press and hold the firmware reset button (some devices)

``` bash
mos flash esp32 --esp-erase-chip
```

## 3. Install to MOS application folder

``` bash
cd ~/.mos/apps.1.25
git clone https://github.com/OffGridNetworks/mos-esp32-robot.git
cd mos-esp32-robot
mos build --platform esp32 && mos flash
```

## 4. Create an account on Blynk

Create an access key and secret using the security menu

Get an access key and add to mos.yml

## 6. Update the WIFI network and password

Create a new standalone device and get the device ID

Create an access key and secret using the security menu (replace variables or set in environment)

``` bash
mos wifi NETWORK_NAME WPA2_NETWORK_PASSWORD
```

