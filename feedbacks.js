import { combineRgb } from '@companion-module/base'

export function getFeedbackDefinitions(self) {
	//var CAMCHECK=parseInt(this.CAM)
	//this.log('debug',"CAM CALLBACK =" + CAMCHECK )

	return {
		CurrentCameraID: {
			type: 'boolean', // Feedbacks can either a simple boolean, or can be an 'advanced' style change (until recently, all feedbacks were 'advanced')
			name: 'Camera Selected',
			description: 'If this Camera number is currently selected in Middle Control, change the Companion button style',
			defaultStyle: {
				// The default style change for a boolean feedback
				// The user will be able to customise these values as well as the fields that will be changed
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(8, 170, 250),
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
				// This callback will bse called whenever companion wants to check if this feedback is 'active' and should affect the button style

				const value = unescape(feedback.options.camera_id)
				if (self.MIDDLE.CAM == value) {
					return true
				} else {
					return false
				}
			},
		},

		RecordingStatus: {
			type: 'boolean',
			name: 'Recording status',
			description: 'Change style when the current camera is recording / not recording',
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(255, 0, 0), // red when recording
			},
			options: [
				{
					type: 'dropdown',
					label: 'Status',
					id: 'status',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Recording' },
						{ id: 'off', label: 'Not recording' },
					],
				},
				{
					// Optional override camera ID.
					// If empty → feedback applies to the currently selected camera.
					// If set  → feedback applies to that specific camera ID,
					//            regardless of which camera is currently active.
					type: 'textinput',
					label: 'Camera ID (optional)',
					id: 'camera_id',
					default: '',
					regex: '^[0-9]*$',
					regexMessage: 'Only numbers are allowed',
				},
			],
			callback: function (feedback) {
				const desired = feedback.options.status // 'on' or 'off'
				const camRaw = String(feedback.options.camera_id ?? '').trim()

				// ------------------------------------------------------------
				// CASE 1: Camera ID override is provided
				// ------------------------------------------------------------
				// In this case:
				// - Ignore REC / REC<n> from the frame
				// - Use REC_LIST, which may contain multiple active cameras
				//   (example: REC_LIST[4,7,8])
				// ------------------------------------------------------------
				if (camRaw !== '') {
					const camId = Number(camRaw)
					const recList = self.MIDDLE.REC_LIST

					let isRecording = false

					// REC_LIST can be stored in different formats depending on the parser.
					// Handle the most common cases defensively.

					if (Array.isArray(recList)) {
						// Example: [4,7,8] or ["4","7","8"]
						isRecording = recList.map((v) => Number(v)).includes(camId)
					} else if (typeof recList === 'string') {
						// Example: "4,7,8"
						isRecording = recList
							.split(',')
							.map((s) => Number(s.trim()))
							.filter((n) => !Number.isNaN(n))
							.includes(camId)
					} else if (recList && typeof recList === 'object') {
						// Example:
						// { "4": true, "7": true }
						// { 4: "1", 7: "1" }
						const value = recList[camRaw] ?? recList[camId]

						if (typeof value === 'boolean') {
							isRecording = value
						} else if (typeof value === 'string') {
							isRecording = value === '1' || value.toLowerCase() === 'true'
						} else if (typeof value === 'number') {
							isRecording = value === 1
						}
					}

					// Apply user-selected condition (Recording / Not recording)
					return desired === 'on' ? isRecording : !isRecording
				}

				// ------------------------------------------------------------
				// CASE 2: No Camera ID override
				// ------------------------------------------------------------
				// Default behavior:
				// - Use REC, which represents the currently selected / active camera
				// ------------------------------------------------------------
				const rec = self.MIDDLE.REC // "0" or "1"
				if (rec === undefined) return false

				const isRecording = rec === '1'
				return desired === 'on' ? isRecording : !isRecording
			},
		},

		CameraConnectionStatus: {
			type: 'boolean',
			name: 'Camera Connexion Status',
			description:
				'Change style when the specified camera is connected (based on CAM_CON_LIST). If Camera ID is empty, uses the currently selected camera (CAM).',
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(0, 200, 0),
			},
			options: [
				{
					// Optional. If empty -> use currently selected camera (self.MIDDLE.CAM)
					type: 'textinput',
					label: 'Camera ID (optional)',
					id: 'camera_id',
					default: '',
					regex: '^[0-9]*$',
					regexMessage: 'Only numbers are allowed',
				},
				{
					type: 'dropdown',
					label: 'Status',
					id: 'status',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Connected' },
						{ id: 'off', label: 'Disconnected' },
					],
				},
			],
			callback: function (feedback) {
				const desired = feedback.options.status // 'on' or 'off'
				const list = self.MIDDLE.CAM_CON_LIST ?? []

				// Determine which camera ID to test:
				// - If user entered one, use it
				// - Otherwise use currently selected camera from the frame: CAM1, CAM2, ...
				const raw = String(feedback.options.camera_id ?? '').trim()
				const camIdToCheck = raw !== '' ? Number(raw) : Number(self.MIDDLE.CAM)

				if (!Array.isArray(list) || Number.isNaN(camIdToCheck)) return false

				const isConnected = list.includes(camIdToCheck)
				return desired === 'on' ? isConnected : !isConnected
			},
		},

		APCRConnectionStatus: {
			type: 'boolean',
			name: 'APC-R Connexion Status',
			description:
				'Change style when the specified APC-R is connected (based on APCR_CON_LIST). If ID is empty, uses the currently selected camera (CAM) as the ID to check.',
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(0, 200, 0),
			},
			options: [
				{
					// Optional. If empty -> use currently selected camera (self.MIDDLE.CAM)
					type: 'textinput',
					label: 'APC-R ID (optional)',
					id: 'apcr_id',
					default: '',
					regex: '^[0-9]*$',
					regexMessage: 'Only numbers are allowed',
				},
				{
					type: 'dropdown',
					label: 'Status',
					id: 'status',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Connected' },
						{ id: 'off', label: 'Disconnected' },
					],
				},
			],
			callback: function (feedback) {
				const desired = feedback.options.status // 'on' or 'off'
				const list = self.MIDDLE.APCR_CON_LIST ?? []

				// Determine which ID to test:
				// - If user entered one, use it
				// - Otherwise use currently selected camera from the frame (CAMx)
				const raw = String(feedback.options.apcr_id ?? '').trim()
				const idToCheck = raw !== '' ? Number(raw) : Number(self.MIDDLE.CAM)

				if (!Array.isArray(list) || Number.isNaN(idToCheck)) return false

				const isConnected = list.includes(idToCheck)
				return desired === 'on' ? isConnected : !isConnected
			},
		},

		AutofocusStatus: {
			type: 'boolean',
			name: 'Autofocus status',
			description: 'Change style when autofocus is enabled/disabled on the current camera',
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(0, 255, 0), // green when condition is true
			},
			options: [
				{
					type: 'dropdown',
					label: 'Status',
					id: 'status',
					default: 'on',
					choices: [
						{ id: 'on', label: 'AF On' },
						{ id: 'off', label: 'AF Off' },
					],
				},
			],
			callback: function (feedback) {
				const desired = feedback.options.status
				const af = self.MIDDLE.AF // "0" or "1" or undefined

				if (af === undefined) return false

				const isOn = af === '1'
				return desired === 'on' ? isOn : !isOn
			},
		},

		DigitalZoomStatus: {
			type: 'boolean',
			name: 'Digital zoom status',
			description: 'Change style when digital zoom is enabled/disabled on the current camera',
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(0, 0, 255), // blue when condition is true
			},
			options: [
				{
					type: 'dropdown',
					label: 'Status',
					id: 'status',
					default: 'on',
					choices: [
						{ id: 'on', label: 'DZoom On' },
						{ id: 'off', label: 'DZoom Off' },
					],
				},
			],
			callback: function (feedback) {
				const desired = feedback.options.status
				const dz = self.MIDDLE.DZOOM // "0" or "1" or undefined

				if (dz === undefined) return false

				const isOn = dz === '1'
				return desired === 'on' ? isOn : !isOn
			},
		},

		CurrentPresetActive: {
			type: 'boolean',
			name: 'Current preset active',
			description: 'Change style when this preset number is active on the current camera',
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(255, 255, 0), // yellow when condition is true
			},
			options: [
				{
					type: 'number',
					label: 'Preset number (0 = none)',
					id: 'preset',
					default: 1,
					min: 0,
					max: 12,
					range: true,
				},
			],
			callback: function (feedback) {
				const desiredPreset = String(feedback.options.preset) // "0".."12"
				const activePreset = self.MIDDLE.PRESET_ACTIVE // "0".."12" or undefined

				if (activePreset === undefined) return false

				return activePreset === desiredPreset
			},
		},
	}
}
