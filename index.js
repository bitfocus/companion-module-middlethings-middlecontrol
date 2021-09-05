var udp = require('../../udp')
var instance_skel = require('../../instance_skel')
var debug
var log

function instance(system, id, config) {
	var self = this

	// super-constructor
	instance_skel.apply(this, arguments)

	self.actions() // export actions
	self.init_presets()

	return self
}

instance.prototype.updateConfig = function (config) {
	var self = this
	self.init_presets()
	
	if (self.udp !== undefined) {
		self.udp.destroy()
		delete self.udp
	}

	if (self.socket !== undefined) {
		self.socket.destroy()
		delete self.socket
	}

	self.config = config

	self.init_udp()
}

instance.prototype.init = function () {
	var self = this

	debug = self.debug
	log = self.log
	self.init_presets()

	self.init_udp()
}

instance.prototype.init_udp = function () {
	var self = this

	if (self.udp !== undefined) {
		self.udp.destroy()
		delete self.udp
	}

	self.status(self.STATE_WARNING, 'Connecting')

	if (self.config.host !== undefined) {
		self.udp = new udp(self.config.host, 2390) // 2390 is the Middle Control Port, this value should never be changed.

		self.udp.on('error', function (err) {
			debug('Network error', err)
			self.status(self.STATE_ERROR, err)
			self.log('error', 'Network error: ' + err.message)
		})

		// If we get data, thing should be good
		self.udp.on('data', function () {
			self.status(self.STATE_OK)
		})

		self.udp.on('status_change', function (status, message) {
			self.status(status, message)
		})
	}
}

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this

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
				
						Official plugin to control Middle Control software using Companion.<br><br>

						Instructions & download ready to go Companion pages at <a href="https://www.middlethings.co/companion" target="_new">middlethings.co/companion</a><br><br>

						If you are running Middle Control on this same computer, you can type  127.0.0.1 in the IP adress field below and press Save.<br> The instance will appear as connected only after a key press has successfuly been sent. Please note that :

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
			label: 'Middle Control IP Address',
			width: 6,
			default:'',
			regex: self.REGEX_IP,
		},
		
	]
}

// When module gets deleted
instance.prototype.destroy = function () {
	var self = this

	if (self.socket !== undefined) {
		self.socket.destroy()
	}

	if (self.udp !== undefined) {
		self.udp.destroy()
	}

	debug('destroy', self.id)
}

// List of choices for the dropdown boxes

instance.prototype.CHOICES_CAMERACOMMAND = [
	{ id: 'AUTOFOCUS', label: 'AutoFocus' },
	{ id: 'AUTOIRIS', label: 'AutoIris' },
	{ id: 'COLORBARS', label: 'Show Color Bars' },
	{ id: 'ZEBRA', label: 'Toggle Zebra' },
	{ id: 'FALSECOLORS', label: 'Toggle False Colors' },
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

instance.prototype.CHOICES_GIMBALCOMMAND = [
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
	{ id: 'ACTIVETRACK', label: 'Active Track Enable/Disable' }
]

instance.prototype.CHOICES_VARIABLECOMMAND = [
	{ id: 'PAN_L', label: 'Pan Left' },
	{ id: 'PAN_R', label: 'Pan Right' },
]

instance.prototype.init_presets = function () {
	var self = this
	var presets = []

	self.setPresetDefinitions(presets)
}

instance.prototype.actions = function (system) {
	var self = this

	self.system.emit('instance_actions', self.id, {
		// Action that selects the camera ID we want to control in Middle Control

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
					choices: self.CHOICES_CAMERACOMMAND,
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
					choices: self.CHOICES_GIMBALCOMMAND,
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

		// Action that sets a custom pan/tilt/zoom speed

		setspeed: {
			label: 'Set Custom Pan/Tilt/Zoom Speed',
			options: [
				{
					type: 'text',
					id: 'Textlabel',
					label: 'Set a custom Pan/Tilt Speed or Zoom Speed Value',
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

instance.prototype.action = function (action) {
	var self = this
	var cmd
	var end
	end = '\n'

	switch (action.action) {
		case 'selectcameraID':
			cmd = 'CAM' + unescape(action.options.id_selectcameraID)
			break

		case 'sendgimbalcommand':
			cmd = unescape(action.options.id_sendgimbalcommand)
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

		case 'setspeed':
			if (action.options.id_setspeedmode == 'PanTilt') {
				cmd = 'PTS' + unescape(action.options.id_setspeed)
				break
			}
			if (action.options.id_setspeedmode == 'Zoom') {
				cmd = 'ZS' + unescape(action.options.id_setspeed)
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
	var sendBuf = Buffer.from(cmd + end, 'latin1')
	if (sendBuf != '') {
		if (self.udp !== undefined) {
			debug('sending', sendBuf, 'to', self.config.host)
			debug('sending message', cmd, 'to', self.config.host)

			self.udp.send(sendBuf)
		}
	}
}

instance_skel.extendedBy(instance)
exports = module.exports = instance
