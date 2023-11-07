
export const CHOICES_END = [
    { id: '', label: 'None' },
    { id: '\n', label: 'LF - \\n (Common UNIX/Mac)' },
    { id: '\r\n', label: 'CRLF - \\r\\n (Common Windows)' },
    { id: '\r', label: 'CR - \\r (Old MacOS)' },
    { id: '\x00', label: 'NULL - \\x00 (Can happen)' },
    { id: '\n\r', label: 'LFCR - \\n\\r (Just stupid)' },
]

export const CHOICES_CAMERACOMMAND = [
    { id: 'AUTOFOCUS', label: 'AutoFocus' },
    { id: 'AUTOIRIS', label: 'AutoIris' },
    { id: 'COLORBARS', label: 'Show Color Bars' },
    { id: 'ZEBRA', label: 'Toggle Zebra' },
    { id: 'FALSECOLORS', label: 'Toggle False Colors' },
    { id: 'FOCUSPEAKING', label: 'Toggle Focus Peaking' },
    { id: 'STATUSVIEW', label: 'Toggle Status View on HDMI Out' },
    { id: 'REC_START', label: 'Start Recording' },
    { id: 'REC_STOP', label: 'Stop Recording' },
    { id: 'REC_START_ALL', label: 'Start Recording on all cameras' },
    { id: 'REC_STOP_ALL', label: 'Stop Recording on all cameras' },
    { id: 'FOCUS+', label: 'Focus in by a step' },
    { id: 'FOCUS-', label: 'Focus out by a step' },
    { id: 'IRIS-', label: 'Iris increase' },
    { id: 'IRIS+', label: 'Iris decrease' },
    { id: 'WB+', label: 'White Balance increase' },
    { id: 'WB-', label: 'White Balance decrease' },
    { id: 'TINT+', label: 'Tint increase' },
    { id: 'TINT-', label: 'Tint decrease' },
    { id: 'ISO+', label: 'ISO increase' },
    { id: 'ISO-', label: 'ISO decrease' },
    { id: 'SHUTTER+', label: 'Shutter increase' },
    { id: 'SHUTTER-', label: 'Shutter decrease' },
    { id: 'CONT+', label: 'Contrast increase' },
    { id: 'CONT-', label: 'Contrast decrease' },
    { id: 'SAT+', label: 'Saturation increase' },
    { id: 'SAT-', label: 'Saturation decrease' },
    { id: 'BLEV+', label: 'Black Level (Pedestal) increase' },
    { id: 'BLEV-', label: 'Black Level (Pedestal) decrease' },
    { id: 'MLEV+', label: 'Mid Level increase' },
    { id: 'MLEV-', label: 'Mid Level decrease' },
    { id: 'WLEV+', label: 'White Level increase' },
    { id: 'WLEV-', label: 'White Level decrease' },
    { id: 'ND+', label: 'ND Filter increase' },
    { id: 'ND-', label: 'ND Filter decrease' },
    { id: 'RESETCCU', label: 'Reset the Color Correction (CCU)' },
]

export const CHOICES_GIMBALCOMMAND = [
    { id: 'PAN_L', label: 'Pan Left' },
    { id: 'PAN_R', label: 'Pan Right' },
    { id: 'PAN_IDLE', label: 'Pan Idle (Required on Key Up)' },
    { id: 'TILT_U ', label: 'Tilt Up' },
    { id: 'TILT_D', label: 'Tilt Down' },
    { id: 'TILT_IDLE', label: 'Tilt Idle (Required on Key Up)' },
    { id: 'ROLL_L', label: 'Roll Left' },
    { id: 'ROLL_R', label: 'Roll Right' },
    { id: 'ROLL_IDLE', label: 'Roll Idle (Required on Key Up)' },
    { id: 'ZOOM+', label: 'Zoom In' },
    { id: 'ZOOM-', label: 'Zoom Out' },
    { id: 'Z0', label: 'Zoom Idle (Required on Key Up)' },
    { id: 'SLIDER+', label: 'Slider Move Right' },
    { id: 'SLIDER-', label: 'Slider Move Left' },
    { id: 'S0', label: 'Slider Idle (Required on Key Up)' },
    { id: 'ZSPEED+', label: 'Zoom Speed Increase' },
    { id: 'ZSPEED-', label: 'Zoom Speed Decrease' },
    { id: 'SPEED+', label: 'Pan/Tilt Speed Increase' },
    { id: 'SPEED-', label: 'Pan/Tilt Speed Decrease' },
    { id: 'SLIDERSPEED+', label: 'Slider Speed Increase' },
    { id: 'SLIDERSPEED-', label: 'Slider Speed Decrease' },
    { id: 'ACTIVETRACK', label: 'Active Track Enable/Disable' },
    { id: 'GIMBALAUTOCALIB', label: 'Start a Gimbal Auto-Calibration' },
    { id: 'MOTORAUTOCALIB', label: 'Start a Zoom Motor Auto-Calibration' },
]

 




export function getActionDefinitions(self) {
    return {
        
    
        
        
    selectcameraID: {
        name: 'Select Camera ID',
        options: [
            {
                type: 'static-text',
                id: 'Textlabel',
                label: 'Set the camera number you want to control :',
                width: 6,
            },
            {
                type: 'textinput',
                id: 'id_selectcameraID',
                label: 'Camera ID :',
                tooltip: 'Set the camera number you want to control (1 to 100)',
                /*default: '1',
                min: 1,
                max: 100,*/
                width: 6,
            },
        ],
        callback: async (event) => {
            
          
           
            const value = unescape(await self.parseVariablesInString(event.options.id_selectcameraID))
            var cmd = 'CAM' + unescape(value)
            self.log('debug', '>> ' + cmd)
            self.send(cmd)
           
        },
    },
    
        
        // Action that sends a camera command
    sendcameracommand: {
        name: 'Send Camera Action',
        options: [
            {
                type: 'static-text',
                id: 'Textlabel',
                label: 'Select the action you want to trigger on the currently selected Camera ID',
                width: 6,
            },
            {
                type: 'multidropdown',
                id: 'id_sendcameracommand',
                label: 'Action :',
                tooltip: 'Select the action you want to trigger on the currently selected Camera ID',
                default: 'AUTOFOCUS',
                /*width: 6*/
                choices: CHOICES_CAMERACOMMAND,
            },
        ],
    callback: async (event) => {
        const cmd = unescape(await self.parseVariablesInString(event.options.id_sendcameracommand))
        self.log('debug', '>> ' + cmd)
        self.send(cmd)
    },
    },
        
        
        
        

        // Action that sends a gimbal command through the APC / APC-R
        sendgimbalcommand: {
            name: 'Send Gimbal Action',
            options: [
                {
                    type: 'static-text',
                    id: 'Textlabel',
                    label:
                        'Note : after a Pan, Tilt, Roll or Zoom Press action, you MUST also add a Release (Key Up) action with an Idle command, which will stop the movement. For instance, a Pan Left key down action should be followed by a Pan Idle key up action',
                    width: 6,
                },
                {
                    type: 'dropdown',
                    id: 'id_sendgimbalcommand',
                    label: 'Action :',
                    tooltip: 'Select the action you want to trigger on the currently selected Camera ID',
                    default: 'PAN_L',
                    /*width: 6*/
                    choices: CHOICES_GIMBALCOMMAND,
                },
            ],
        callback: async (event) => {
            const cmd = unescape(await self.parseVariablesInString(event.options.id_sendgimbalcommand))
            self.log('debug', '>> ' + cmd)
            self.send(cmd)
        },
    },
        
        
        
        
        

        
        // Action that sends a Preset control command through the APC / APC-R

        preset: {
            name: 'Recall/Save Preset',
            options: [
                {
                    type: 'static-text',
                    id: 'Textlabel',
                    label:
                        'Select the Preset you want to save or recall. If you want to recall preset number 5.8, set Camera ID to 5, preset number to 8 and select Recall. ',
                    width: 6,
                },
                {
                    type: 'textinput',
                    id: 'id_presetcameraID',
                    label: 'Camera ID :',
                    default: '1',
                    min: 1,
                    max: 100,
                    width: 6,
                    /*regex: self.REGEX_SIGNED_NUMBER*/
                },
                {
                    type: 'textinput',
                    id: 'id_presetnumber',
                    label: 'Preset Number :',
                    default: '1',
                    min: 1,
                    max: 99,
                    width: 6,
                },
                {
                    type: 'dropdown',
                    id: 'id_presetmode',
                    label: 'Recall or Save Preset ? :',
                    default: 'RECALL',
                    choices: [
                        { id: 'RECALL', label: 'Recall' },
                        { id: 'SAVE', label: 'Save' },
                    ],
                },
            ],
        callback: async (event) => {
            
            const PresetCamID = unescape(await self.parseVariablesInString(event.options.id_presetcameraID))
            const PresetNumber = unescape(await self.parseVariablesInString(event.options.id_presetnumber))
            
            var cmd = ''
            
            if (event.options.id_presetmode == 'RECALL') {
                cmd = 'PRESET' + PresetNumber + 'C' + PresetCamID
               
            }
            if (event.options.id_presetmode == 'SAVE') {
                cmd = 'SPRESET' + PresetNumber + 'C' + PresetCamID
            
            }
            
            self.log('debug', '>> ' + cmd)
            self.send(cmd)
            
        },
    },
        
        
        
 
    preset_transition: {
        name: 'Set Preset Transition Duration',
        options: [
            {
                type: 'static-text',
                id: 'Textlabel',
                label: 'Set the duration of the transition to the next preset which will be recalled',
                width: 6,
            },

            {
                type: 'textinput',
                id: 'id_settransitionduration',
                label: 'Duration (in s)',
                /*min: 0,
                max: 120,*/
                default: 1,
            },
        ],
    callback: async (event) => {
        const cmd = unescape(await self.parseVariablesInString(event.options.id_settransitionduration))
        self.log('debug', '>> ' + cmd)
        self.send(cmd)
    },
},

    // Action that sets a custom pan/tilt/zoom speed

    setspeed: {
        name: 'Set Pan/Tilt/Zoom Speed',
        options: [
            {
                type: 'static-text',
                id: 'Textlabel',
                label: 'Set the Pan/Tilt Speed or Zoom Speed Value',
                width: 6,
            },
            {
                type: 'dropdown',
                id: 'id_setspeedmode',
                label: 'Select the setting you want to adjust :',
                default: 'PanTilt',
                choices: [
                    { id: 'PanTilt', label: 'Pan/Tilt Speed' },
                    { id: 'Zoom', label: 'Zoom Speed' },
                ],
            },
            {
                type: 'textinput',
                id: 'id_setspeed',
                label: 'Value (0 to 100)',
                min: 1,
                max: 100,
                range: true,
                default: 100,
            },
        ],
    callback: async (event) => {
        var cmd = ''
        if (event.options.id_setspeedmode == 'PanTilt') {
            
            const valuePT = unescape(await self.parseVariablesInString(event.options.id_setspeed))
            cmd = 'PTS' + unescape(valuePT)
            
        }
        if (event.options.id_setspeedmode == 'Zoom') {
            
            const valueZ = unescape(await self.parseVariablesInString(event.options.id_setspeed))
            cmd = 'ZS' + unescape(valueZ)
           
        }
        
        self.log('debug', '>> ' + cmd)
        self.send(cmd)
        
    },
},

    // Action that sets a custom pan/tilt/roll/zoom speed value or absolute value

    sendabs: {
        name: 'Send a Custom Gimbal PTZ Absolute Value',
        options: [
            {
                type: 'static-text',
                id: 'Textlabel',
                label: 'Set a custom absolute PTZ value for the Pan, Tilt, Roll & Zoom of your Gimbal. Leave the fields that you do not want to touch empty. ',
                width: 6,
            },
            {
                type: 'textinput',
                id: 'id_sendabspan',
                label: 'Pan Value (-2048 to 2048)',
               /* min: -2048,
                max: 2048,
                range: true,*/
                default: 0,
            },
            {
                type: 'textinput',
                id: 'id_sendabstilt',
                label: 'Tilt Value (-2048 to 2048)',
                /*min: -2048,
                max: 2048,
                range: true,*/
                default: 0,
            },
            {
                type: 'textinput',
                id: 'id_sendabsroll',
                label: 'Roll Value (-2048 to 2048)',
                /*min: -2048,
                max: 2048,
                range: true,*/
                default: 0,
            },
            {
                type: 'textinput',
                id: 'id_sendabszoom',
                label: 'Zoom Value (0 to 4096)',
                /*min: -2048,
                max: 2048,
                range: true,*/
                default: 0,
            },
            {
                type: 'textinput',
                id: 'id_sendabsduration',
                label: 'Transition duration (s)',
                /*min: 0,
                max: 120,*/
                default: 1,
            },
        ],
    callback: async (event) => {
        var prefix = 'a'
        var sendabsval = ''
        var sendabsvalpan = ''
        var sendabsvaltilt = ''
        var sendabsvalroll = ''
        var sendabsvalzoom = ''
        var sendabsdurationval = ''

         sendabsvalpan = unescape(await self.parseVariablesInString(event.options.id_sendabspan))
         sendabsvaltilt = unescape(await self.parseVariablesInString(event.options.id_sendabstilt))
         sendabsvalroll = unescape(await self.parseVariablesInString(event.options.id_sendabsroll))
         sendabsvalzoom = unescape(await self.parseVariablesInString(event.options.id_sendabszoom))
         sendabsdurationval = unescape(await self.parseVariablesInString(event.options.id_sendabsduration))
        
        var cmd = 'aGLOB;' + 'aP' + sendabsvalpan + ';aT' + sendabsvaltilt + ';aR' + sendabsvalroll + ';aZ' + sendabsvalzoom + ';' + sendabsdurationval
        self.log('debug', '>> ' + cmd)
        self.send(cmd)
    },
},

    // Action that sets a custom camera absolute value

    sendabscameracommand: {
        name: 'Send a Custom Camera Absolute Value',
        options: [
            {
                type: 'static-text',
                id: 'Textlabel',
                label:
                    'Sets a specific camera value instead of +/- adjustments. For instance, set the ISO to +32db (aISO32) or the White Balance to 5750K (aWB5750)',
                width: 6,
            },
            {
                type: 'textinput',
                id: 'id_sendabscameracommand',
                label: 'Command & Value',
                default: 'aISO32',
            },
            {
                type: 'static-text',
                id: 'Textlabel',
                label: 'Set Iris : aIxx (xx from 1.2 to 22) ',
                width: 6,
            },
            {
                type: 'static-text',
                id: 'Textlabel',
                label: 'Set ISO : aISOxx (xx from -12 to 36) ',
                width: 6,
            },
            {
                type: 'static-text',
                id: 'Textlabel',
                label: 'Set White Balance : aWBxx (xx from 2500 to 10000) ',
                width: 6,
            },
            {
                type: 'static-text',
                id: 'Textlabel',
                label: 'Set Tint : aTINTxx (xx from -50 to 50) ',
                width: 6,
            },
            {
                type: 'static-text',
                id: 'Textlabel',
                label: 'Set Focus : aFOCUSxx (xx from 0.0 to 1.0) ',
                width: 6,
            },
            {
                type: 'static-text',
                id: 'Textlabel',
                label: 'For the complete list of values please check out https://www.middlethings.co/api  ',
                width: 6,
            },
        ],
    callback: async (event) => {
        const cmd = unescape(await self.parseVariablesInString(event.options.id_sendabscameracommand))
        self.log('debug', '>> ' + cmd)
        self.send(cmd)
    },
},
        
        
        
        
        
            }
        }
    


    
		

			

		