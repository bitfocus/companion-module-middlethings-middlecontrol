import { InstanceBase, InstanceStatus, runEntrypoint, TCPHelper, UDPHelper } from '@companion-module/base'
import { ConfigFields } from './config.js'
import { getActionDefinitions } from './actions.js'
import { getVariables } from './variables.js'
import { getFeedbackDefinitions } from './feedbacks.js'
import { getPresetDefinitions } from './presets.js'

class instance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Disconnected)

		this.setFeedbackDefinitions(getFeedbackDefinitions(this))
		this.setActionDefinitions(getActionDefinitions(this))
		this.setPresetDefinitions(getPresetDefinitions(this))
		this.setVariableDefinitions(getVariables(this))

		this.init_udp()
		//this.init_tcp()
		this.MIDDLE = { CAM: '1' }
		//this.updateVariables()
		await this.configUpdated(config)
	}

	// When module gets deleted
	async destroy() {
		if (this.socket) {
			this.socket.destroy()
		} else if (this.udp) {
			this.udp.destroy()
		} else {
			this.updateStatus(InstanceStatus.Disconnected)
		}
	}

	async configUpdated(config) {
		if (this.udp) {
			this.udp.destroy()
			delete this.udp
		}

		if (this.socket) {
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

	// Return config fields for web config
	getConfigFields() {
		return ConfigFields
	}

	init_udp() {
		if (this.udp) {
			this.udp.destroy()
			delete this.udp
		}

		this.updateStatus(InstanceStatus.Connecting)

		if (this.config.host) {
			this.udp = new UDPHelper(this.config.host, 2390)

			this.udp.on('error', (err) => {
				this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
				this.log('error', 'Network error: ' + err.message)
			})

			// If we get data, thing should be good
			this.udp.on('listening', () => {
				console.log('UDP listening')
				this.updateStatus(InstanceStatus.Ok)
			})

			this.udp.on('status_change', (status, message) => {
				console.log('UDP status_change', status, message)
				this.updateStatus(status, message)
			})
		} else {
			this.updateStatus(InstanceStatus.BadConfig)
		}
	}

	init_tcp() {
		if (this.socket) {
			this.socket.destroy()
			delete this.socket
		}

		this.updateStatus(InstanceStatus.Connecting)

		if (this.config.host) {
			this.socket = new TCPHelper(this.config.host, 11580)

			this.socket.on('status_change', (status, message) => {
				this.updateStatus(status, message)
				this.log('TCP status_change', status, message)
			})

			this.socket.on('error', (err) => {
				this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
				this.log('error', 'Network error: ' + err.message)

				this.setVariableValues({
					aPAN_var: '-',
					aTILT_var: '-',
					aROLL_var: '-',
					aZOOM_var: '-',
					aSLIDER_var: '-',
					aBLACKLEV_var: '-',
					aMIDLEV_var: '-',
					aWHITELEV_var: '-',
					aWB_var: '-',
					aF_var: '-',
					aI_var: '-',
					aTINT_var: '-',
					aISO_var: '-',
					aCONT_var: '-',
					aSAT_var: '-',
					aSHUT_var: '-',
					CAM_var: '-',
					PTS_var: '-',
					ZS_var: '-',
					PRES_D_var: '-',
					PRES_C_var: '-',
				})
			})

			this.socket.on('data', (data) => {
				//PARSE INCOMING DATA
				var response_array = data.toString().slice(1, -2).split(';')
				this.log('debug', 'RESPONSE ARRAY =' + response_array)

				// Standard Middle Control Feedback into ARRAY 1 (detects using PTS presence)
				var presence_pts = response_array.findIndex((element) => element.includes('PTS'))
				if (parseFloat(presence_pts) > -1) {
					var response_array1 = data.toString().slice(1, -2).split(';')
					//    this.log('debug', 'RESPONSE ARRAY 1 NORM=' + response_array1)

					//GET CAM FROM TCP
					var CAM = response_array1.find((element) => {
						if (element.includes('CAM')) {
							return true
						}
					})
					if (CAM !== undefined) {
						CAM = CAM.substring(3)
						//this.log('debug', 'CAM =' + CAM)
						//  this.send(CAM)
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

					//GET SLIDER SPEED FROM TCP
					var SS = response_array1.find((element) => {
						if (element.includes('SS')) {
							return true
						}
					})
					if (SS !== undefined) {
						SS = parseFloat(SS.substring(2))
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

					//GET PRESET COMPLETION  FROM TCP
					var PRES_C = response_array1.find((element) => {
						if (element.includes('PRES_C')) {
							return true
						}
					})
					if (PRES_C !== undefined) {
						PRES_C = parseFloat(PRES_C.substring(6))
					}

					// GET RECORDING STATUS FROM TCP (REC0 / REC1)
					// IMPORTANT: exclude REC_LIST[...] entries
					let REC = response_array1.find((element) => {
						return element.startsWith('REC') && !element.startsWith('REC_LIST[')
					})

					if (REC !== undefined) {
						REC = REC.substring(3) // "0" or "1"
					}
					// --------------------------------------------------
					// GET RECORDING CAMERA LIST FROM TCP (REC_LIST[1,4,7])
					// --------------------------------------------------
					let REC_LIST = response_array1.find((element) => {
						if (element.startsWith('REC_LIST[')) {
							return true
						}
					})

					if (REC_LIST !== undefined) {
						// Extract inside brackets: "REC_LIST[4,7,8]" → "4,7,8"
						const listStr = REC_LIST.slice(9, -1)

						this.MIDDLE.REC_LIST = listStr
							.split(',')
							.map((v) => Number(v.trim()))
							.filter((n) => !Number.isNaN(n))

						this.setVariableValues({
							LIST_REC_var: this.MIDDLE.REC_LIST.join(','),
						})

						this.log('debug', 'Parsed REC_LIST = ' + JSON.stringify(this.MIDDLE.REC_LIST))
					} else {
						// Important: clear list if not present in frame
						this.MIDDLE.REC_LIST = []
					}

					// --------------------------------------------------
					// GET CAMERA CONNECTION LIST (CAM_CON_LIST[4,3,7])
					// --------------------------------------------------
					let CAM_CON_LIST = response_array1.find((element) => element.startsWith('CAM_CON_LIST['))

					if (CAM_CON_LIST !== undefined) {
						const listStr = CAM_CON_LIST.slice(13, -1) // remove "CAM_CON_LIST[" and "]"
						this.MIDDLE.CAM_CON_LIST = listStr
							.split(',')
							.map((v) => Number(v.trim()))
							.filter((n) => !Number.isNaN(n))

						this.setVariableValues({
							LIST_CAM_CON_var: this.MIDDLE.CAM_CON_LIST.join(','),
						})
					} else {
						this.MIDDLE.CAM_CON_LIST = []
					}

					// --------------------------------------------------
					// GET APC-R CONNECTION LIST (APCR_CON_LIST[1,2,7])
					// --------------------------------------------------
					let APCR_CON_LIST = response_array1.find((element) => element.startsWith('APCR_CON_LIST['))

					if (APCR_CON_LIST !== undefined) {
						const listStr = APCR_CON_LIST.slice(14, -1) // remove "APCR_CON_LIST[" and "]"
						this.MIDDLE.APCR_CON_LIST = listStr
							.split(',')
							.map((v) => Number(v.trim()))
							.filter((n) => !Number.isNaN(n))

						this.setVariableValues({
							LIST_APCR_CON_var: this.MIDDLE.APCR_CON_LIST.join(','),
						})
					} else {
						this.MIDDLE.APCR_CON_LIST = []
					}

					// GET AUTOFOCUS STATUS FROM TCP (AF0 / AF1)
					let AF = response_array1.find((element) => {
						if (element.startsWith('AF')) {
							return true
						}
					})
					if (AF !== undefined) {
						AF = AF.substring(2) // "0" or "1"
					}

					// GET DIGITAL ZOOM STATUS FROM TCP (DZOOM0 / DZOOM1)
					let DZOOM = response_array1.find((element) => {
						if (element.startsWith('DZOOM')) {
							return true
						}
					})
					if (DZOOM !== undefined) {
						DZOOM = DZOOM.substring(5) // "0" or "1"
					}

					// GET CURRENT ACTIVE PRESET NUMBER FROM TCP (PRES_ACTIVE0..9)
					let PRES_ACTIVE = response_array1.find((element) => {
						if (element.startsWith('PRES_ACTIVE')) {
							return true
						}
					})
					if (PRES_ACTIVE !== undefined) {
						// "PRES_ACTIVE" is 11 characters → keep what comes after
						PRES_ACTIVE = PRES_ACTIVE.substring(11) // e.g. "0", "2", "3"
					}
					if (CAM !== undefined) {
						this.setVariableValues({ CAM_var: CAM })
					} else {
						this.setVariableValues({ CAM_var: '' })
					}

					if (PTS !== undefined) {
						this.setVariableValues({ PTS_var: PTS })
					} else {
						this.setVariableValues({ PTS_var: '' })
					}
					if (ZS !== undefined) {
						this.setVariableValues({ ZS_var: ZS })
					} else {
						this.setVariableValues({ ZS_var: '' })
					}
					if (SS !== undefined) {
						this.setVariableValues({ SS_var: SS })
					} else {
						this.setVariableValues({ SS_var: '' })
					}
					if (PRES_D !== undefined) {
						this.setVariableValues({ PRES_D_var: PRES_D })
					} else {
						this.setVariableValues({ PRES_D_var: '' })
					}
					if (PRES_C !== undefined) {
						this.setVariableValues({ PRES_C_var: PRES_C })
					} else {
						this.setVariableValues({ PRES_C_var: '' })
					}
					if (REC !== undefined) {
						this.setVariableValues({ REC_var: REC })
					} else {
						this.setVariableValues({ REC_var: '' })
					}

					if (AF !== undefined) {
						this.setVariableValues({ AF_var: AF })
					} else {
						this.setVariableValues({ AF_var: '' })
					}

					if (DZOOM !== undefined) {
						this.setVariableValues({ DZOOM_var: DZOOM })
					} else {
						this.setVariableValues({ DZOOM_var: '' })
					}

					if (PRES_ACTIVE !== undefined) {
						this.setVariableValues({ PRESET_ACTIVE_var: PRES_ACTIVE })
					} else {
						this.setVariableValues({ PRESET_ACTIVE_var: '' })
					}

					// CONVERT TO PROTOTYPE FOR FEEDBACKS
					this.MIDDLE.CAM = CAM
					this.MIDDLE.REC = REC
					this.MIDDLE.AF = AF
					this.MIDDLE.DZOOM = DZOOM
					this.MIDDLE.PRESET_ACTIVE = PRES_ACTIVE
					instance.prototype.CAM = CAM
					instance.prototype.PTS = PTS
					instance.prototype.ZS = ZS
					instance.prototype.REC = REC
					instance.prototype.AF = AF
					instance.prototype.DZOOM = DZOOM
					instance.prototype.PRESET_ACTIVE = PRES_ACTIVE
				}

				// ATEM Middle Control Feedback into ARRAY 2 (detects using aWB presence)
				var presence_aWB = response_array.findIndex((element) => element.includes('aWB')) // Detects if it is an ATEM Middle Control Feedback    (using WB value)
				if (parseFloat(presence_aWB) > -1) {
					var response_array2 = data.toString().slice(1, -2).split(';')
					//    this.log('debug', 'RESPONSE ARRAY 2 ATEM=' + response_array2)
					//    this.log('debug', 'ATEM Connected to MiddleControl')

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
					let aI = response_array2.find((element) => {
						if (element.includes('aI')) {
							return true
						}
					})
					if (aI !== undefined) {
						aI = parseFloat(aI.substring(2))
						instance.prototype.aI = aI
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
						instance.prototype.aSAT = aSAT
					}

					// GET CONTRAST FROM TCP
					var aCONT = response_array2.find((element) => {
						if (element.includes('aCONT')) {
							return true
						}
					})
					if (aCONT !== undefined) {
						aCONT = parseFloat(aCONT.substring(5))
						instance.prototype.aCONT = aCONT
					}

					// GET BLACK LEVEL FROM TCP
					var aBLACKLEV = response_array2.find((element) => {
						if (element.includes('aBLACKLEV')) {
							return true
						}
					})
					if (aBLACKLEV !== undefined) {
						aBLACKLEV = parseFloat(aBLACKLEV.substring(9))
						instance.prototype.aBLEV = aBLACKLEV
					}

					// GET MID LEVEL FROM TCP
					var aMIDLEV = response_array2.find((element) => {
						if (element.includes('aMIDLEV')) {
							return true
						}
					})
					if (aMIDLEV !== undefined) {
						aMIDLEV = parseFloat(aMIDLEV.substring(7))
						instance.prototype.aMLEV = aMIDLEV
					}

					// GET WHITELEV FROM TCP
					var aWHITELEV = response_array2.find((element) => {
						if (element.includes('aWHITELEV')) {
							return true
						}
					})
					if (aWHITELEV !== undefined) {
						aWHITELEV = parseFloat(aWHITELEV.substring(9))
						instance.prototype.aWLEV = aWHITELEV
					}

					// Create Companion Variables

					if (aWB !== undefined) {
						this.setVariableValues({ aWB_var: aWB })
					} else {
						this.setVariableValues({ aWB_var: '' })
					}
					if (aF !== undefined) {
						this.setVariableValues({ aF_var: aF })
					} else {
						this.setVariableValues({ aF_var: '' })
					}
					if (aI !== undefined) {
						this.setVariableValues({ aI_var: aI })
					} else {
						this.setVariableValues({ aI_var: '' })
					}
					if (aTINT !== undefined) {
						this.setVariableValues({ aTINT_var: aTINT })
					} else {
						this.setVariableValues({ aTINT_var: '' })
					}
					if (aISO !== undefined) {
						this.setVariableValues({ aISO_var: aISO })
					} else {
						this.setVariableValues({ aISO_var: '' })
					}
					if (aSHUT !== undefined) {
						this.setVariableValues({ aSHUT_var: '1/' + aSHUT })
					} else {
						this.setVariableValues({ aSHUT_var: '' })
					}
					if (aSAT !== undefined) {
						this.setVariableValues({ aSAT_var: aSAT })
					} else {
						this.setVariableValues({ aSAT_var: '' })
					}

					if (aCONT !== undefined) {
						this.setVariableValues({ aCONT_var: aCONT })
					} else {
						this.setVariableValues({ aCONT_var: '' })
					}
					if (aBLACKLEV !== undefined) {
						this.setVariableValues({ aBLACKLEV_var: aBLACKLEV })
					} else {
						this.setVariableValues({ aBLACKLEV_var: '' })
					}
					if (aMIDLEV !== undefined) {
						this.setVariableValues({ aMIDLEV_var: aMIDLEV })
					} else {
						this.setVariableValues({ aMIDLEV_var: '' })
					}
					if (aWHITELEV !== undefined) {
						this.setVariableValues({ aWHITELEV_var: aWHITELEV })
					} else {
						this.setVariableValues({ aWHITELEV: '' })
					}
				} else {
					//this.log('debug', 'VARIABLES_NULL')
					this.setVariableValues({ aBLACKLEV_var: '-' })
					this.setVariableValues({ aMIDLEV_var: '-' })
					this.setVariableValues({ aWHITELEV_var: '-' })
					this.setVariableValues({ aWB_var: '-' })
					this.setVariableValues({ aF_var: '-' })
					this.setVariableValues({ aI_var: '-' })
					this.setVariableValues({ aTINT_var: '-' })
					this.setVariableValues({ aISO_var: '-' })
					this.setVariableValues({ aCONT_var: '-' })
					this.setVariableValues({ aSAT_var: '-' })
					this.setVariableValues({ aSHUT_var: '-' })
				}

				// Gimbal Middle Control Feedback into ARRAY 3 (detects using aPAN presence)
				var presence_aPAN = response_array.findIndex((element) => element.includes('aPAN')) // Detects if it is an Gimbal Canbus Feedback    (using aPAN value)
				if (parseFloat(presence_aPAN) > -1) {
					var response_array3 = data.toString().slice(1, -2).split(';')
					//    this.log('debug', 'RESPONSE ARRAY 3 GIMBAL=' + response_array3)

					//    this.log('debug', 'Gimbal CANBUS Connected')

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

					// GET SLIDER POS FROM TCP
					var aSLIDER = response_array3.find((element) => {
						if (element.includes('aSLIDER')) {
							return true
						}
					})
					if (aSLIDER !== undefined) {
						aSLIDER = parseFloat(aSLIDER.substring(5))
					}

					// Create Companion Variables

					if (aPAN !== undefined) {
						this.setVariableValues({ aPAN_var: aPAN })
					} else {
						this.setVariableValues({ aPAN_var: '' })
					}
					if (aTILT !== undefined) {
						this.setVariableValues({ aTILT_var: aTILT })
					} else {
						this.setVariableValues({ aTILT_var: '' })
					}
					if (aROLL !== undefined) {
						this.setVariableValues({ aROLL_var: aROLL })
					} else {
						this.setVariableValues({ aROLL_var: '' })
					}
					if (aZOOM !== undefined) {
						this.setVariableValues({ aZOOM_var: aZOOM })
					} else {
						this.setVariableValues({ aZOOM_var: '' })
					}
					if (aSLIDER !== undefined) {
						this.setVariableValues({ aSLIDER_var: aSLIDER })
					} else {
						this.setVariableValues({ aSLIDER_var: '' })
					}
				} else {
					//   this.log('debug', 'VARIABLES_NULL')
					this.setVariableValues({ aPAN_var: '-' })
					this.setVariableValues({ aTILT_var: '-' })
					this.setVariableValues({ aROLL_var: '-' })
					this.setVariableValues({ aZOOM_var: '-' })
					this.setVariableValues({ aSLIDER_var: '-' })
				}

				this.checkFeedbacks('CurrentCameraID')
				this.checkFeedbacks('RecordingStatus')
				this.checkFeedbacks('AutofocusStatus')
				this.checkFeedbacks('DigitalZoomStatus')
				this.checkFeedbacks('CurrentPresetActive')
				this.checkFeedbacks('CameraConnectionStatus')
				this.checkFeedbacks('APCRConnectionStatus')
			})
		} else {
			this.updateStatus(InstanceStatus.BadConfig)
		}
	}

	send(cmd) {
		let end = '\n'
		let PresetCamID
		let PresetNumber

		this.log('debug', 'SEND =' + cmd)

		/*
            // Iris +/- Management

            var aI = instance.prototype.aI
            let iris_array = [
                1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.5, 2.8, 3.2, 3.5, 4.0, 4.5, 5.0, 5.6, 6.3, 7.1, 8.0, 9.0, 10.0, 11.0, 13.0, 14.0,
                16.0, 18.0, 20.0, 22.0,
            ]
            for (var i = 0; i < iris_array.length - 1; i++) {
                if (aI >= iris_array[i] && aI < iris_array[i + 1]) {
                    aI = iris_array[i]
                    break
                }
            }

            if (cmd == 'IRIS+') {
                aI = iris_array[i + 1]
                cmd = 'aI' + aI
            }

            if (cmd == 'IRIS-') {
                aI = iris_array[i - 1]
                cmd = 'aI' + aI
            }
*/
		// Contrast +/- Management

		var aCONT = instance.prototype.aCONT
		if (cmd == 'CONT+') {
			cmd = 'aCONT' + (aCONT + 1.0)
		}
		if (cmd == 'CONT-') {
			cmd = 'aCONT' + (aCONT - 1.0)
		}

		// Saturation +/- Management

		var aSAT = instance.prototype.aSAT
		if (cmd == 'SAT+') {
			cmd = 'aSAT' + (aSAT + 1.0)
		}
		if (cmd == 'SAT-') {
			cmd = 'aSAT' + (aSAT - 1.0)
		}

		// Black Level +/- Management

		var aBLEV = instance.prototype.aBLEV
		if (cmd == 'BLEV+') {
			cmd = 'aBLACKLEV' + (aBLEV + 0.005)
		}
		if (cmd == 'BLEV-') {
			cmd = 'aBLACKLEV' + (aBLEV - 0.005)
		}

		// Mid Level +/- Management

		var aMLEV = instance.prototype.aMLEV
		if (cmd == 'MLEV+') {
			cmd = 'aMIDLEV' + (aMLEV + 0.005)
		}
		if (cmd == 'MLEV-') {
			cmd = 'aMIDLEV' + (aMLEV - 0.005)
		}

		// White Level +/- Management

		var aWLEV = instance.prototype.aWLEV
		if (cmd == 'WLEV+') {
			cmd = 'aWHITELEV' + (aWLEV + 0.01)
		}
		if (cmd == 'WLEV-') {
			cmd = 'aWHITELEV' + (aWLEV - 0.01)
		}

		let sendBuf = Buffer.from(cmd + end, 'latin1')

		if (sendBuf != '') {
			if (this.config.prot == 'tcp') {
				if (this.socket !== undefined && this.socket.isConnected) {
					// this.log('sending ', sendBuf, 'to', this.config.host)
					this.socket.send(sendBuf)
					this.log('debug', 'TCP Message sent :' + cmd)
				} else {
					this.log('error', 'TCP Socket not connected')
				}
			} else if (this.config.prot == 'udp') {
				if (this.udp !== undefined) {
					//this.debug('sending', sendBuf, 'to', this.config.host)
					this.udp.send(sendBuf)
					this.log('debug', 'UDP Message sent :' + cmd)
				} else {
					this.log('error', 'UDP Socket not connected')
				}
			}
		}
	}
}

runEntrypoint(instance, [])

////old

/*
	init_presets() {
		let presets = []
		this.setPresetDefinitions(presets)
	}

*/
