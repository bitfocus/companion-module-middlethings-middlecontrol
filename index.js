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
		this.init_variables()
		this.init_feedbacks()

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

				this.setVariable('aPAN_var', '-')
				this.setVariable('aTILT_var', '-')
				this.setVariable('aROLL_var', '-')
				this.setVariable('aZOOM_var', '-')
				this.setVariable('aBLACKLEV_var', '-')
				this.setVariable('aMIDLEV_var', '-')
				this.setVariable('aWHITELEV_var', '-')
				this.setVariable('aWB_var', '-')
				this.setVariable('aF_var', '-')
				this.setVariable('aI_var', '-')
				this.setVariable('aTINT_var', '-')
				this.setVariable('aISO_var', '-')
				this.setVariable('aCONT_var', '-')
				this.setVariable('aSAT_var', '-')
				this.setVariable('aSHUT_var', '-')
				this.setVariable('CAM_var', '-')
				this.setVariable('PTS_var', '-')
				this.setVariable('ZS_var', '-')
				this.setVariable('PRES_D_var', '-')
			})

			this.socket.on('connect', () => {
				this.status(this.STATE_OK)
				this.debug('Connected')
			})

			this.socket.on('data', (data) => {
				//PARSE INCOMING DATA
				var response_array = data.toString().slice(1, -2).split(';')
				//	this.log('debug', 'RESPONSE ARRAY =' + response_array)

				// Standard Middle Control Feedback into ARRAY 1 (detects using PTS presence)
				var presence_pts = response_array.findIndex((element) => element.includes('PTS'))
				if (parseFloat(presence_pts) > -1) {
					var response_array1 = data.toString().slice(1, -2).split(';')
					//	this.log('debug', 'RESPONSE ARRAY 1 NORM=' + response_array1)

					//GET CAM FROM TCP
					var CAM = response_array1.find((element) => {
						if (element.includes('CAM')) {
							return true
						}
					})
					if (CAM !== undefined) {
						CAM = CAM.substring(3)
					}

					//GET PAN/TILT SPEED FROM TCP
					var PTS = response_array1.find((element) => {
						if (element.includes('PTS')) {
							return true
						}
					})
					if (PTS !== undefined) {
						PTS = parseFloat(PTS.substring(3))
					}

					//GET ZOOM SPEED FROM TCP
					var ZS = response_array1.find((element) => {
						if (element.includes('ZS')) {
							return true
						}
					})
					if (ZS !== undefined) {
						ZS = parseFloat(ZS.substring(2))
					}

					//GET PRESET TRANSITION SPEED FROM TCP
					var PRES_D = response_array1.find((element) => {
						if (element.includes('PRES_D')) {
							return true
						}
					})
					if (PRES_D !== undefined) {
						PRES_D = parseFloat(PRES_D.substring(6))
					}
					/*	this.log('debug', 'CAM = ' + CAM)
					this.log('debug', 'PTS = ' + PTS)
					this.log('debug', 'ZS = ' + ZS)
					this.log('debug', 'PRES_D = ' + PRES_D)*/

					if (CAM !== undefined) {
						this.setVariable('CAM_var', CAM)
					} else {
						this.setVariable('CAM_var', '')
					}

					if (PTS !== undefined) {
						this.setVariable('PTS_var', PTS)
					} else {
						this.setVariable('PTS_var', '')
					}
					if (ZS !== undefined) {
						this.setVariable('ZS_var', ZS)
					} else {
						this.setVariable('ZS_var', '')
					}
					if (PRES_D !== undefined) {
						this.setVariable('PRES_D_var', PRES_D)
					} else {
						this.setVariable('PRES_D_var', '')
					}

					// CONVERT TO PROTOTYPE FOR FEEDBACKS
					instance.prototype.CAM = CAM
					instance.prototype.PTS = PTS
					instance.prototype.ZS = ZS
				}

				// ATEM Middle Control Feedback into ARRAY 2 (detects using aWB presence)
				var presence_aWB = response_array.findIndex((element) => element.includes('aWB')) // Detects if it is an ATEM Middle Control Feedback	(using WB value)
				if (parseFloat(presence_aWB) > -1) {
					var response_array2 = data.toString().slice(1, -2).split(';')
					//	this.log('debug', 'RESPONSE ARRAY 2 ATEM=' + response_array2)
					//	this.log('debug', 'ATEM Connected to MiddleControl')

					// GET WHITE BALANCE FROM TCP
					var aWB = response_array2.find((element) => {
						if (element.includes('aWB')) {
							return true
						}
					})
					if (aWB !== undefined) {
						aWB = parseFloat(aWB.substring(3))
					}

					// GET FOCUS FROM TCP
					var aF = response_array2.find((element) => {
						if (element.includes('aF')) {
							return true
						}
					})
					if (aF !== undefined) {
						aF = parseFloat(aF.substring(2))
					}

					// GET IRIS FROM TCP
					var aI = response_array2.find((element) => {
						if (element.includes('aI')) {
							return true
						}
					})
					if (aI !== undefined) {
						aI = parseFloat(aI.substring(2))
					}

					// GET TINT FROM TCP
					var aTINT = response_array2.find((element) => {
						if (element.includes('aTINT')) {
							return true
						}
					})
					if (aTINT !== undefined) {
						aTINT = parseFloat(aTINT.substring(5))
					}

					// GET ISO FROM TCP
					var aISO = response_array2.find((element) => {
						if (element.includes('aISO')) {
							return true
						}
					})
					if (aISO !== undefined) {
						aISO = parseFloat(aISO.substring(4))
					}

					// GET SHUTTER FROM TCP
					var aSHUT = response_array2.find((element) => {
						if (element.includes('aSHUT')) {
							return true
						}
					})
					if (aSHUT !== undefined) {
						aSHUT = parseFloat(aSHUT.substring(5))
					}

					// GET SATURATION FROM TCP
					var aSAT = response_array2.find((element) => {
						if (element.includes('aSAT')) {
							return true
						}
					})
					if (aSAT !== undefined) {
						aSAT = parseFloat(aSAT.substring(4))
					}

					// GET CONTRAST FROM TCP
					var aCONT = response_array2.find((element) => {
						if (element.includes('aCONT')) {
							return true
						}
					})
					if (aCONT !== undefined) {
						aCONT = parseFloat(aCONT.substring(5))
					}

					// GET BLACK LEVEL FROM TCP
					var aBLACKLEV = response_array2.find((element) => {
						if (element.includes('aBLACKLEV')) {
							return true
						}
					})
					if (aBLACKLEV !== undefined) {
						aBLACKLEV = parseFloat(aBLACKLEV.substring(9))
					}

					// GET MID LEVEL FROM TCP
					var aMIDLEV = response_array2.find((element) => {
						if (element.includes('aMIDLEV')) {
							return true
						}
					})
					if (aMIDLEV !== undefined) {
						aMIDLEV = parseFloat(aMIDLEV.substring(7))
					}

					// GET WHITELEV FROM TCP
					var aWHITELEV = response_array2.find((element) => {
						if (element.includes('aWHITELEV')) {
							return true
						}
					})
					if (aWHITELEV !== undefined) {
						aWHITELEV = parseFloat(aWHITELEV.substring(9))
					}

					// Create Companion Variables

					if (aWB !== undefined) {
						this.setVariable('aWB_var', aWB)
					} else {
						this.setVariable('aWB_var', '')
					}
					if (aF !== undefined) {
						this.setVariable('aF_var', aF)
					} else {
						this.setVariable('aF_var', '')
					}
					if (aI !== undefined) {
						this.setVariable('aI_var', aI)
					} else {
						this.setVariable('aI_var', '')
					}
					if (aTINT !== undefined) {
						this.setVariable('aTINT_var', aTINT)
					} else {
						this.setVariable('aTINT_var', '')
					}
					if (aISO !== undefined) {
						this.setVariable('aISO_var', aISO)
					} else {
						this.setVariable('aISO_var', '')
					}
					if (aSHUT !== undefined) {
						this.setVariable('aSHUT_var', aSHUT)
					} else {
						this.setVariable('aSHUT_var', '')
					}
					if (aSAT !== undefined) {
						this.setVariable('aSAT_var', aSAT)
					} else {
						this.setVariable('aSAT_var', '')
					}

					if (aCONT !== undefined) {
						this.setVariable('aCONT_var', aCONT)
					} else {
						this.setVariable('aCONT_var', '')
					}
					if (aBLACKLEV !== undefined) {
						this.setVariable('aBLACKLEV_var', aBLACKLEV)
					} else {
						this.setVariable('aBLACKLEV_var', '')
					}
					if (aMIDLEV !== undefined) {
						this.setVariable('aMIDLEV_var', aMIDLEV)
					} else {
						this.setVariable('aMIDLEV_var', '')
					}
					if (aWHITELEV !== undefined) {
						this.setVariable('aWHITELEV_var', aWHITELEV)
					} else {
						this.setVariable('aWHITELEV', '')
					}

					/*
					this.log('debug', 'WB = ' + aWB)
					this.log('debug', 'Focus = ' + aF)
					this.log('debug', 'Iris = ' + aI)
					this.log('debug', 'Tint = ' + aTINT)
					this.log('debug', 'ISO = ' + aISO)
					this.log('debug', 'Shutter = ' + aSHUT)
					this.log('debug', 'Saturation = ' + aSAT)
					this.log('debug', 'Contrast = ' + aCONT)
					this.log('debug', 'BlackLev = ' + aBLACKLEV)
					this.log('debug', 'MidLev = ' + aMIDLEV)
					this.log('debug', 'WhiteLev = ' + aWHITELEV)
					*/
				} else {
					/*this.log('debug', 'VARIABLES_NULL')*/
					this.setVariable('aBLACKLEV_var', '-')
					this.setVariable('aMIDLEV_var', '-')
					this.setVariable('aWHITELEV_var', '-')
					this.setVariable('aWB_var', '-')
					this.setVariable('aF_var', '-')
					this.setVariable('aI_var', '-')
					this.setVariable('aTINT_var', '-')
					this.setVariable('aISO_var', '-')
					this.setVariable('aCONT_var', '-')
					this.setVariable('aSAT_var', '-')
					this.setVariable('aSHUT_var', '-')
				}

				// Gimbal Middle Control Feedback into ARRAY 3 (detects using aPAN presence)
				var presence_aPAN = response_array.findIndex((element) => element.includes('aPAN')) // Detects if it is an Gimbal Canbus Feedback	(using aPAN value)
				if (parseFloat(presence_aPAN) > -1) {
					var response_array3 = data.toString().slice(1, -2).split(';')
					//	this.log('debug', 'RESPONSE ARRAY 3 GIMBAL=' + response_array3)

					//	this.log('debug', 'Gimbal CANBUS Connected')

					// GET ABS PAN FROM TCP
					var aPAN = response_array3.find((element) => {
						if (element.includes('aPAN')) {
							return true
						}
					})
					if (aPAN !== undefined) {
						aPAN = parseFloat(aPAN.substring(4))
					}

					// GET ABS TILT FROM TCP
					var aTILT = response_array3.find((element) => {
						if (element.includes('aTILT')) {
							return true
						}
					})
					if (aTILT !== undefined) {
						aTILT = parseFloat(aTILT.substring(5))
					}

					// GET ABS ROLL FROM TCP
					var aROLL = response_array3.find((element) => {
						if (element.includes('aROLL')) {
							return true
						}
					})
					if (aROLL !== undefined) {
						aROLL = parseFloat(aROLL.substring(5))
					}

					// GET ABS ZOOM FROM TCP
					var aZOOM = response_array3.find((element) => {
						if (element.includes('aZOOM')) {
							return true
						}
					})
					if (aZOOM !== undefined) {
						aZOOM = parseFloat(aZOOM.substring(5))
					}

					// Create Companion Variables

					if (aPAN !== undefined) {
						this.setVariable('aPAN_var', aPAN)
					} else {
						this.setVariable('aPAN_var', '')
					}
					if (aTILT !== undefined) {
						this.setVariable('aTILT_var', aTILT)
					} else {
						this.setVariable('aTILT_var', '')
					}
					if (aROLL !== undefined) {
						this.setVariable('aROLL_var', aROLL)
					} else {
						this.setVariable('aROLL_var', '')
					}
					if (aZOOM !== undefined) {
						this.setVariable('aZOOM_var', aZOOM)
					} else {
						this.setVariable('aZOOM_var', '')
					}

					/*	this.log('debug', 'aPAN = ' + aPAN)
					this.log('debug', 'aTILT = ' + aTILT)
					this.log('debug', 'aROLL = ' + aROLL)
					this.log('debug', 'aZOOM = ' + aZOOM)
					*/
				} else {
					/*	this.log('debug', 'VARIABLES_NULL')*/
					this.setVariable('aPAN_var', '-')
					this.setVariable('aTILT_var', '-')
					this.setVariable('aROLL_var', '-')
					this.setVariable('aZOOM_var', '-')
				}

				this.checkFeedbacks('CurrentCameraID')
			})
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

						If you are running Middle Control on this same computer, you can type  127.0.0.1 in the IP adress field below and press Save. Please note that :

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
				label: 'Middle Control Software Version',
				default: 'tcp',
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

	init_feedbacks() {
		//var CAMCHECK=parseInt(this.CAM)
		//this.log('debug',"CAM CALLBACK =" + CAMCHECK )

		const feedbacks = {}
		feedbacks['CurrentCameraID'] = {
			type: 'boolean', // Feedbacks can either a simple boolean, or can be an 'advanced' style change (until recently, all feedbacks were 'advanced')
			label: 'Camera Selected',
			description: 'If this Camera number is currently selected in Middle Control, change the Companion button style',
			style: {
				// The default style change for a boolean feedback
				// The user will be able to customise these values as well as the fields that will be changed
				color: this.rgb(0, 0, 0),
				bgcolor: this.rgb(8, 170, 250),
			},
			// options is how the user can choose the condition the feedback activates for
			options: [
				{
					type: 'number',
					label: 'Camera ID',
					id: 'camera_id',
					default: 1,
				},
			],
			callback: function (feedback) {
				// This callback will be called whenever companion wants to check if this feedback is 'active' and should affect the button style
				if (instance.prototype.CAM == feedback.options.camera_id) {
					return true
				} else {
					return false
				}
			},
		}
		this.setFeedbackDefinitions(feedbacks)
	}

	init_variables() {
		this.setVariableDefinitions([
			{
				label: 'Selected Camera Number',
				name: 'CAM_var',
			},
			{
				label: 'Pan/Tilt Speed',
				name: 'PTS_var',
			},
			{
				label: 'Zoom Speed',
				name: 'ZS_var',
			},
			{
				label: 'Preset Transition Speed',
				name: 'PRES_D_var',
			},
			{
				label: 'White Balance',
				name: 'aWB_var',
			},
			{
				label: 'Tint',
				name: 'aTINT_var',
			},
			{
				label: 'Gain (dB)',
				name: 'aISO_var',
			},
			{
				label: 'Shutter',
				name: 'aSHUT_var',
			},
			{
				label: 'Contrast',
				name: 'aCONT_var',
			},
			{
				label: 'Saturation',
				name: 'aSAT_var',
			},
			{
				label: 'Black Level (Luma)',
				name: 'aBLACKLEV_var',
			},
			{
				label: 'Mid Level (Luma)',
				name: 'aMIDLEV_var',
			},
			{
				label: 'White Level (Luma)',
				name: 'aWHITELEV_var',
			},
			{
				label: 'Focus Value',
				name: 'aF_var',
			},
			{
				label: 'Gimbal Absolute Pan Value',
				name: 'aPAN_var',
			},
			{
				label: 'Gimbal Absolute Tilt Value',
				name: 'aTILT_var',
			},
			{
				label: 'Gimbal Absolute Roll Value',
				name: 'aROLL_var',
			},
			{
				label: 'Gimbal Motor Zoom Value',
				name: 'aZOOM_var',
			},
		])
	}

	actions() {
		this.setActions({
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
				label: 'Set Pan/Tilt/Zoom Speed',
				options: [
					{
						type: 'text',
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
						label: 'Set a custom absolute PTZ value for the Pan, Tilt, Roll & Zoom',
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
					cmd = 'CAM' + unescape(value)
				})
				break

			case 'sendgimbalcommand':
				this.parseVariables(action.options.id_sendgimbalcommand, (value) => {
					cmd = unescape(value)
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
				cmd = 'PRES_D' + unescape(action.options.id_settransitionduration)
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
					this.log('debug', 'TCP Message sent :' + cmd)
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
	}
}
exports = module.exports = instance
