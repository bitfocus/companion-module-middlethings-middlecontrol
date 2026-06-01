# companion-module-middlethings-middlecontrol

The Middle Control Companion plugin remotely controls the Middle Control software, which drives **Blackmagic and Sony cameras** and **DJI gimbals** (via Middle Things APC-R / APC-R Mini / APC-R Mini Lite). It can run on the same device as Middle Control, or on any device on the same network. Connects over TCP on port 11580.

**Features**

- Select Camera ID
- Send Camera Action (CCU: focus, iris, WB, tint, gain/ISO, shutter, ND, levels; Auto modes; zebra/false-colour/peaking)
- Send Gimbal Action (pan/tilt/roll/zoom/slider, speed, recenter, sleep/wake, Active Track)
- Recall/Save Preset & preset transition duration
- Recording start/stop (per camera or all)
- Sony menus, MultiSelector and Custom C1–C6 buttons
- Set Custom Camera & Pan/Tilt/Zoom Positions
- Set Custom Pan/Tilt/Zoom Speed
- Send a Custom Command (SDK)
- Feedbacks (recording tally, camera/APC-R connection, active preset, AF, digital zoom)
- Live Variables for camera & gimbal settings
- **Streamdeck+ rotary-encoder presets** (Focus, Iris, ISO/Gain, WB, Shutter, Tint, Zoom Speed) — see the "Encoders (Streamdeck+)" preset category

## Development

This is an ESM project (`"type": "module"`). Install with `yarn install`. Load it as a developer module in Companion (point Companion at this folder) to test against a running Middle Control instance.

## Changes

### v3.2.2

- Added ready-made **Streamdeck+ rotary-encoder presets** (Focus, Iris, ISO/Gain, White Balance, Shutter, Tint, Contrast, Saturation, Black Level, Pan/Tilt Speed, Zoom Speed) in the "Encoders (Streamdeck+)" category
- Fixed TCP feedback parsing so messages combined or split by the network are correctly reassembled (more reliable variables & feedbacks)
- Fixed cached parameter state being shared between multiple Middle Control instances
- Hardened command sending against malformed input coming from variables
- Fixed a socket handle leak when the module is restarted or reconfigured
- Fixed Contrast / Saturation / Black Level (Pedestal) (+/-) buttons: they now send raw relative commands so Middle Control applies the exact same step as its on-screen GUI buttons. 
- Fixed the White Level variable not clearing on disconnect
- AUTO parameters (White Balance / Tint / Gain / Iris / Shutter / Focus) now show "-" instead of "NaN" in the variables
- Variables now show "-" on startup instead of being blank until the first update
- Fixed the Gimbal "Send Gimbal Action" default (was blank / Tilt Up id typo)
- Removed the unused legacy UDP path; saved "UDP" configurations now connect over TCP automatically

### v3.2.1

- Adds actions for Auto Iris, Auto Shutter, Auto Gain and Auto White Balance for supported cameras
- Adds support for sending camera and gimbal actions to specific camera IDs simultaneously 
- Adds feedbacks for APC-R Connection Status, Camera recording (IP) and Camera Connexion Status (IP)
- Adds variable with the list of cameras currently connected (over the network)
- Adds variable with the list of cameras currently recording (over the network)
- Adds variable with the list of APC-R, APC-R Mini & APC-R Mini Lite currently connected (over the network)
- Adds option to specify a camera number for some feedbacks so that you can check multiple status at a glance (Recording Status, APC-R Connexion Status, Camera Connexion Status)

### v3.1.0

- Adds support for remote control of Sony Camera Menus 
- Adds support for Sony Multi Selector Control
- Adds support for Digital Zoom toggle
- Adds support for triggering Sony Custom C1-C6 Buttons 
- Adds variables for Rec status (Sony) / AF (Sony) / Digital Zoom (Sony) and Currently Active Preset 
- Adds feedbacks for Rec status (Sony) / AF (Sony) / Digital Zoom (Sony) and Currently Active Preset 

### v2.3.0

- Fix for Iris control not working properly. 

### v2.2.0

- Added remote Sleep / Wake mode & Recenter

### v2.1.1

- Fixed Preset Transition Speed not working

### v2.1.0

- Improved action "Send a Custom Gimbal PTZ Absolute Value" which can now send Pan / Tilt / Roll / Zoom instruction in the same action. 


### v2.0.1

- Fixed variables not displaying properly in Companion 3


### v2.0.0

- Added Support for Companion 3

  
### v1.1.9

- Added Support for Preset Completion feedback (in %)

### v1.1.8

- Added Support for custom Preset Pages
- Preset number & cam ID can now be parsed

### v1.1.7

- Fixed Zoom control not properly working 
- Fixed White level too slow to change

### v1.1.4

- Added Contrast / Saturation / BlackMidWhite Levels Commands
- Added Support for Dynamic Variables inside action fields
- Added Support for sending custom camera commands
- Added ResetAll CCU command
- Fixed latency issue when viewing parameters
- Fixed too many Iris Steps / not following proper convention
- General Stability Update

### v1.1.3

- Added Camera ID Selection Feedback 
- Added Dynamic Variables to access ATEM values such as White Balance, Tint, ISO, Iris, Pan / Tilt Speed, ... 
- Added Preset Transition Speed Command

### v1.1.2

- Hotfix on a bug that caused crash at boot

### v1.1.1

- Added TCP support for Middle Control 2.2 and above (better performance)
- Fixed the Status saying "Connecting..." before a key is pressed (Middle Control 2.2 and above)
- Added Focus Peaking Command

### v1.0.2

- Added support for DJI Active Track remote control
- Improved config page clarity

### v1.0.1

- Removed TCP calls and optimized variables.

### v1.0.0

- Initial public release (after a lot of local field testing and developments )