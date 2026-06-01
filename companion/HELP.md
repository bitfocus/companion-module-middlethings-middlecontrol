## Middle Control Companion Plugin

Official plugin to remotely control the **Middle Control** software. Middle Control drives **Blackmagic and Sony cameras** and **DJI gimbals** (via Middle Things **APC-R / APC-R Mini / APC-R Mini Lite** hardware). Companion can run on the same computer as Middle Control, or on any computer on the same network.

Instructions & ready-to-go Companion pages: https://www.middlethings.co/companion

### Setup

1. Install and launch **Middle Control** on a Mac on your network.
2. In Companion, add this connection and set **Target IP**:
   - Same computer as Companion → `127.0.0.1`
   - Another computer → that computer's IP address
3. The module connects over **TCP on port 11580**. The connection turns **green (OK)** once Middle Control is reachable. If it stays yellow, check the IP, that Middle Control is running, and that port 11580 isn't blocked by a firewall.
4. To control **gimbal movement** you need an APC-R / APC-R Mini / APC-R Mini Lite.

### What you can do

**Cameras (CCU):** select the active camera, adjust focus, iris, white balance, tint, gain/ISO, shutter, ND, contrast, saturation and black/mid/white levels; toggle Auto Focus / Auto Iris / Auto WB / Auto Gain / Auto Shutter; zebra, false colour, focus peaking, colour bars.

**Gimbal:** pan / tilt / roll / zoom / slider, speed control, recenter, sleep/wake, auto-calibration, Active Track.

**Recording:** start/stop on the active camera or on all cameras at once.

**Presets:** recall and save positions, and set the preset transition duration.

**Sony extras:** menu navigation, MultiSelector, and Custom C1–C6 buttons.

**Custom commands (SDK):** send any raw command/value (e.g. set ISO or WB to a specific value). See https://www.middlethings.co/api

### Feedbacks & variables

Boolean **feedbacks** let buttons reflect live state: recording tally, camera connection, APC-R connection, active preset, Auto Focus and Digital Zoom. Several feedbacks accept an optional Camera ID so you can monitor multiple cameras at a glance.

**Variables** expose live values (selected camera, pan/tilt & zoom speed, WB, tint, gain, iris, shutter, contrast, saturation, levels, gimbal pan/tilt/roll/zoom, recording status, lists of connected/recording cameras, …). They show `-` until the module is connected and receiving data.

### Streamdeck+ encoders

This module ships ready-made rotary-encoder presets in the **"Encoders (Streamdeck+)"** preset category — Focus, Iris, ISO/Gain, White Balance, Shutter, Tint and Zoom Speed. Rotate to step the value; press (where shown) toggles the matching Auto mode.

Note: gimbal **pan / tilt / roll / zoom** are not offered as encoder presets, because those start a continuous movement that needs a separate stop command on release — which a rotary detent doesn't provide. Use buttons for gimbal motion.

### Reporting issues

https://github.com/bitfocus/companion-module-middlethings-middlecontrol/issues