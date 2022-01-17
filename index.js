const tcp = require('../../tcp')
const udp = require('../../udp')
const instance_skel = require('../../instance_skel')

class instance extends instance_skel {
	/**
	 * Create an instance of the module
	 *
	 * @param {EventEmitter} system - the brains of the operation
	 * @param {string} id - the instance ID
	 * @param {Object} config - saved user configuration parameters
	 * @since 1.0.0
	 */
	constructor(system, id, config) {
		super(system, id, config)
		this.actions() // export actions
		this.init_presets() // export presets
	}

	updateConfig(config) {
		this.init_presets()

		if (this.udp !== undefined) {
			this.udp.destroy()
			delete this.udp
		}

		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		this.config = config

		if (this.config.prot == 'tcp') {
			this.init_tcp()
		}

		if (this.config.prot == 'udp') {
			this.init_udp()
		}
	}

	init() {
		this.init_presets()
		if (this.config.prot == 'tcp') {
			this.init_tcp()
		}

		if (this.config.prot == 'udp') {
			this.init_udp()
		}
	}

	init_udp() {
		if (this.udp !== undefined) {
			this.udp.destroy()
			delete this.udp
		}

		this.status(this.STATE_WARNING, 'Connecting...')

		if (this.config.host !== undefined) {
			this.udp = new udp(this.config.host, 2390) // 2390 is the Middle Control UDP Port, this value should never be changed.

			this.udp.on('error', (err) => {
				this.debug('Network error', err)
				this.status(this.STATE_ERROR, err)
				this.log('error', 'Network error: ' + err.message)
			})

			// If we get data, thing should be good
			this.udp.on('data', () => {
				this.status(this.STATE_OK)
			})

			this.udp.on('status_change', (status, message) => {
				this.status(status, message)
			})
		}
	}

	init_tcp() {
		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		this.status(this.STATE_WARNING, 'Connecting...')

		if (this.config.host) {
			this.socket = new tcp(this.config.host, 11580) // 11580 is the Middle TCP Control Port, this value should never be changed.

			this.socket.on('status_change', (status, message) => {
				this.status(status, message)
			})

			this.socket.on('error', (err) => {
				this.debug('Network error', err)
				this.status(this.STATE_ERROR, err)
				this.log('error', 'Network error: ' + err.message)
			})

			this.socket.on('connect', () => {
				this.status(this.STATE_OK)
				this.debug('Connected')
			})

			this.socket.on('data', (data) => {})
		}
	}

	// Return config fields for web config
	config_fields() {
		return [
			{
				type: 'text',
			id: 'info',
			label: 'Information',
			width: 12,
			value: `
				<div class="alert alert-secondary">
					<h3>Middle Control</h3>
					<div>
				
						Official plugin to control MiddleControl software using Companion.<br><br>

						Instructions & download ready to go Companion pages at <a href="https://www.middlethings.co/companion" target="_new">middlethings.co/companion</a><br><br>

						If you are running Middle Control on this same computer, you can type  127.0.0.1 in the IP adress field below and press Save. (if running Windows, make sure you are using v2.1.5 or above of Middle Control) <br> The instance will appear as connected only after a key press has successfuly been sent. Please note that :

						<ul>
							<li>Middle Control software has to be running (locally on this computer or on any computer on this network) </li>
							<li>Middle Control software has to be connected to your ATEM if you have one</li>
							<li>In order to control gimbal movements you will need to use an APC-R</li>
						</ul>
						If you have any questions, please let us know at support@middlethings.co
						<br><br>
						<a href="https://www.middlethings.co/product-middle-control/#downloads" target="_new" class="btn btn-primary">Download Middle Control</a>
						<a href="https://middlethings.co/companion" target="_new" class="btn btn-secondary">Custom Companion pages</a>
					</div>
				</div>
			`,
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 6,
				regex: this.REGEX_IP,
			},
			{
				type: 'dropdown',
				id: 'prot',
				label: 'Middle Control Version',
				default: 'udp',
				choices: [
					{ id: 'tcp', label: 'Latest' },
					{ id: 'udp', label: 'Before 2.2' },
				],
			},
		]
	}

	// When module gets deleted
	destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy()
		}

		if (this.udp !== undefined) {
			this.udp.destroy()
		}

		this.debug('destroy', this.id)
	}

	CHOICES_END = [
		{ id: '', label: 'None' },
		{ id: '\n', label: 'LF - \\n (Common UNIX/Mac)' },
		{ id: '\r\n', label: 'CRLF - \\r\\n (Common Windows)' },
		{ id: '\r', label: 'CR - \\r (Old MacOS)' },
		{ id: '\x00', label: 'NULL - \\x00 (Can happen)' },
		{ id: '\n\r', label: 'LFCR - \\n\\r (Just stupid)' },
	]

	CHOICES_CAMERACOMMAND = [
		{ id: 'AUTOFOCUS', label: 'AutoFocus' },
		{ id: 'AUTOIRIS', label: 'AutoIris' },
		{ id: 'COLORBARS', label: 'Show Color Bars' },
		{ id: 'ZEBRA', label: 'Toggle Zebra' },
		{ id: 'FALSECOLORS', label: 'Toggle False Colors' },
		{ id: 'FOCUSPEAKING', label: 'Toggle Focus Peaking' },
		{ id: 'STATUSVIEW', label: 'Toggle Status View on HDMI Out' },
		{ id: 'FOCUS+', label: 'Focus in by a step' },
		{ id: 'FOCUS-', label: 'Focus out by a step' },
		{ id: 'IRIS+', label: 'Iris increase' },
		{ id: 'IRIS-', label: 'Iris decrease' },
		{ id: 'WB+', label: 'White Balance increase' },
		{ id: 'WB-', label: 'White Balance decrease' },
		{ id: 'TINT+', label: 'Tint increase' },
		{ id: 'TINT-', label: 'Tint decrease' },
		{ id: 'ISO+', label: 'ISO increase' },
		{ id: 'ISO-', label: 'ISO decrease' },
		{ id: 'SHUTTER+', label: 'Shutter increase' },
		{ id: 'SHUTTER-', label: 'Shutter decrease' },
		{ id: 'ND+', label: 'ND Filter increase' },
		{ id: 'ND-', label: 'ND Filter decrease' },
		{ id: 'REC_START', label: 'Start Recording' },
		{ id: 'REC_STOP', label: 'Stop Recording' },
		{ id: 'REC_START_ALL', label: 'Start Recording on all cameras' },
		{ id: 'REC_STOP_ALL', label: 'Stop Recording on all cameras' },
	]
	
	CHOICES_GIMBALCOMMAND = [
		{ id: 'PAN_L', label: 'Pan Left' },
		{ id: 'PAN_R', label: 'Pan Right' },
		{ id: 'PAN_IDLE', label: 'Pan Idle (Required on Key Up)' },
		{ id: 'TILT_U ', label: 'Tilt Up' },
		{ id: 'TILT_D', label: 'Tilt Down' },
		{ id: 'TILT_IDLE', label: 'Tilt Idle (Required on Key Up)' },
		{ id: 'ROLL_L', label: 'Roll Left' },
		{ id: 'ROLL_R', label: 'Roll Right' },
		{ id: 'ROLL_IDLE', label: 'Roll Idle (Required on Key Up)' },
		{ id: 'ZOOM+', label: 'Zoom in by a step' },
		{ id: 'ZOOM-', label: 'Zoom out by a step' },
		{ id: 'ZSPEED+', label: 'Zoom Speed Increase' },
		{ id: 'ZSPEED-', label: 'Zoom Speed Decrease' },
		{ id: 'SPEED+', label: 'Pan/Tilt Speed Increase' },
		{ id: 'SPEED-', label: 'Pan/Tilt Speed Decrease' },
		{ id: 'ACTIVETRACK', label: 'Active Track Enable/Disable' },
	]

	init_presets() {
		let presets = []
		this.setPresetDefinitions(presets)
	}

	actions(system) {
		this.system.emit('instance_actions', this.id, {
			selectcameraID: {
				label: 'Select Camera ID',
				options: [
					{
						type: 'text',
						id: 'Textlabel',
						label: 'Set the camera number you want to control :',
						width: 6,
					},
					{
						type: 'number',
						id: 'id_selectcameraID',
						label: 'Camera ID :',
						tooltip: 'Select the camera you want to control',
						default: '1',
						min: 1,
						max: 100,
						width: 6,
					},
				],
			},
	
			// Action that sends a camera command
	
			sendcameracommand: {
				label: 'Send Camera Action',
				options: [
					{
						type: 'text',
						id: 'Textlabel',
						label: 'Select the action you want to trigger on the currently selected Camera ID',
						width: 6,
					},
					{
						type: 'dropdown',
						id: 'id_sendcameracommand',
						label: 'Action :',
						tooltip: 'Select the action you want to trigger on the currently selected Camera ID',
						default: 'AUTOFOCUS',
						/*width: 6*/
						choices: this.CHOICES_CAMERACOMMAND,
					},
				],
			},
	
			// Action that sends a gimbal command through the APC / APC-R
	
			sendgimbalcommand: {
				label: 'Send Gimbal Action',
				options: [
					{
						type: 'text',
						id: 'Textlabel',
						label:
							'Note : after a Pan, Tilt or Roll Press action, you MUST also add a Release action with an Idle command after at least 70ms, which will stop the movement. For instance, a Pan Left key down action should be followed by a Pan Idle key up action after at least a 70ms delay.',
						width: 6,
					},
					{
						type: 'dropdown',
						id: 'id_sendgimbalcommand',
						label: 'Action :',
						tooltip: 'Select the action you want to trigger on the currently selected Camera ID',
						default: 'PAN_L',
						/*width: 6*/
						choices: this.CHOICES_GIMBALCOMMAND,
					},
				],
			},
	
			// Action that sends a Preset control command through the APC / APC-R
	
			preset: {
				label: 'Recall/Save Preset',
				options: [
					{
						type: 'text',
						id: 'Textlabel',
						label:
							'Select the Preset you want to save or recall. If you want to recall preset number 5.8, set Camera ID to 5, preset number to 8 and select Recall. ',
						width: 6,
					},
					{
						type: 'number',
						id: 'id_presetcameraID',
						label: 'Camera ID :',
						default: '1',
						min: 1,
						max: 100,
						width: 6,
						/*regex: self.REGEX_SIGNED_NUMBER*/
					},
					{
						type: 'number',
						id: 'id_presetnumber',
						label: 'Preset Number (1-12) :',
						default: '1',
						min: 1,
						max: 12,
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
			},
	

			preset_transition: {
				label: 'Set Preset Transition Duration',
				options: [
					{
						type: 'text',
						id: 'Textlabel',
						label: 'Set the duration of the transition to the next preset which will be recalled',
						width: 6,
					},
					
					{
						type: 'number',
						id: 'id_settransitionduration',
						label: 'Duration (in s)',
						min: 0,
						max: 120,
						range: true,
						default: 1,
					},
				],
			},
			
						// Action that sets a custom pan/tilt/zoom speed

			setspeed: {
				label: 'Set Max PTZ Speed',
				options: [
					{
						type: 'text',
						id: 'Textlabel',
						label: 'Set a maximum Pan/Tilt Speed or Zoom Speed Value',
						width: 6,
					},
					{
						type: 'dropdown',
						id: 'id_setspeedmode',
						label: 'Select the setting you want to adjust :',
						default: 'PanTilt',
						choices: [
							{ id: 'PanTilt', label: 'Pan/Tilt Max Speed' },
							{ id: 'Zoom', label: 'Zoom Max Speed' },
						],
					},
					{
						type: 'number',
						id: 'id_setspeed',
						label: 'Value',
						min: 1,
						max: 100,
						range: true,
						default: 100,
					},
				],
			},

			// Action that sets a custom pan/tilt/roll/zoom speed value or absolute value

			sendabs: {
				label: 'Send a Custom PTZ Absolute Value',
				options: [
					{
						type: 'text',
						id: 'Textlabel',
						label: 'Set a custom absolute PTZ Speed for the Pan, Tilt, Roll & Zoom',
						width: 6,
					},
					{
						type: 'dropdown',
						id: 'id_sendabsmode',
						label: 'Select the parameter you want to set :',
						default: 'Pan',
						choices: [
							{ id: 'Pan', label: 'Pan Value' },
							{ id: 'Tilt', label: 'Tilt Value' },
							{ id: 'Roll', label: 'Roll Value' },
							{ id: 'Zoom', label: 'Zoom Value' },
						],
					},
					{
						type: 'number',
						id: 'id_sendabs',
						label: 'Value',
						min: -2048,
						max: 2048,
						range: true,
						default: 0,
					},
					{
						type: 'number',
						id: 'id_sendabsduration',
						label: 'Transition duration (s)',
						min: 0,
						max: 120,
						range: true,
						default: 1,
					},
				],
			},
			// Legacy UDP action
	
			/*
			'send': {
				label: 'Send Command',
				options: [
					{
						type: 'textinput',
						id: 'id_send',
						label: 'Command:',
						tooltip: 'Use %hh to insert Hex codes',
						default: '',
						width: 6
					},
					{
						type: 'dropdown',
						id: 'id_end',
						label: 'Command End Character:',
						default: '\n',
						choices: self.CHOICES_END
					}
	
				]
			}*/
		})
	}

	action(action) {
		let cmd
		let end
		end = '\n'

		switch (action.action) {
			case 'selectcameraID':
				this.parseVariables(action.options.id_selectcameraID, (value) => {
					cmd = 'CAM' + unescape(value);
				})
				break
	
			case 'sendgimbalcommand':
				this.parseVariables(action.options.id_sendgimbalcommand, (value) => {
					cmd = unescape(value);
				})
				break
	
			case 'sendcameracommand':
				cmd = unescape(action.options.id_sendcameracommand)
				break
	
			case 'preset':
				if (action.options.id_presetmode == 'RECALL') {
					cmd = 'PRESET' + unescape(action.options.id_presetnumber) + 'C' + unescape(action.options.id_presetcameraID)
					break
				}
				if (action.options.id_presetmode == 'SAVE') {
					cmd = 'SPRESET' + unescape(action.options.id_presetnumber) + 'C' + unescape(action.options.id_presetcameraID)
					break
				}

			case 'preset_transition':
		
						cmd = 'PTRANS' + unescape(action.options.id_settransitionduration)
						break
	
			case 'setspeed':
				if (action.options.id_setspeedmode == 'PanTilt') {
					cmd = 'PTS' + unescape(action.options.id_setspeed)
					break
				}
				if (action.options.id_setspeedmode == 'Zoom') {
					cmd = 'ZS' + unescape(action.options.id_setspeed)
					break
				}

			case 'sendabs':
				cmd = unescape(action.options.id_sendabsspeed)
				
				if (action.options.id_sendabsmode == 'Pan') {
					cmd = 'aP' + unescape(action.options.id_sendabs) + ';' + unescape(action.options.id_sendabsduration)
					
					break
				}
				if (action.options.id_sendabsmode == 'Tilt') {
					cmd = 'aT' + unescape(action.options.id_sendabs) + ';' + unescape(action.options.id_sendabsduration)
					
					break
				}
				if (action.options.id_sendabsmode == 'Roll') {
					cmd = 'aR' + unescape(action.options.id_sendabs) + ';' + unescape(action.options.id_sendabsduration)
					
					break
				}
				if (action.options.id_sendabsmode == 'Zoom') {
					cmd = 'aZ' + unescape(action.options.id_sendabs) + ';' + unescape(action.options.id_sendabsduration)
					
					break
				}


	
			case 'send':
				cmd = unescape(action.options.id_send)
				break
		}

		/*
		 * create a binary buffer pre-encoded 'latin1' (8bit no change bytes)
		 * sending a string assumes 'utf8' encoding
		 * which then escapes character values over 0x7F
		 * and destroys the 'binary' content
		 */
		let sendBuf = Buffer.from(cmd + end, 'latin1')

		if (sendBuf != '') {
			if (this.config.prot == 'tcp') {
				this.debug('sending ', sendBuf, 'to', this.config.host)

				if (this.socket !== undefined && this.socket.connected) {
					this.socket.send(sendBuf)
					this.log('debug','TCP Message sent :'+cmd);

				} else {
					this.debug('Socket not connected :(')
				}
			}

			if (this.config.prot == 'udp') {
				if (this.udp !== undefined) {
					this.debug('sending', sendBuf, 'to', this.config.host)

					this.udp.send(sendBuf)
				}
			}
		}

	/*	this.socket.on('data', function (data) {

			var newdata = ""+data;
			var newdatachunks = newdata.split("\n");
		
				 for (var i = 0 ; i<(newdatachunks.length-1);i++) {
					 console.log('debug',"real data is :"+newdatachunks[i]); 
				 }
		
		});*/
		
	}
}
exports = module.exports = instance
