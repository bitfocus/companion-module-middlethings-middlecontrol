# companion-module-middlethings-middlecontrol

The Middle Control Companion plugin can remotely control the Middle Control Software which in turns controls Blackmagic cameras and even DJI gimbals through the Middle Things APC or APC-R. It can run on the same device that runs Middle Control, or on a remote device on the same network.

## Getting Started

The yarn headless command will perform all the steps to build the module.         

**Available actions in this module**

- Select Camera ID   
- Send Camera Action
- Send Gimbal Action
- Recall/Save Preset
- Set Custom Camera & Pan/Tilt/Zoom Positions 
- Set Custom Pan/Tilt/Zoom Speed 
- Access Camera & Gimbal settings in realtime using Variables 

## Changes

### v2.3.0

- Slight Fix

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