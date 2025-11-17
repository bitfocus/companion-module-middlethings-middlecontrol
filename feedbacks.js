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
			description: 'Change style when this camera is recording / not recording',
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(255, 0, 0), // red when active
			},
			options: [
				{
					type: 'textinput',
					label: 'Camera ID',
					id: 'camera_id',
					default: '1',
				},
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
			],
			callback: function (feedback) {
				const cam = unescape(feedback.options.camera_id)
				const desired = feedback.options.status

				// only care about the selected camera
				if (self.MIDDLE.CAM != cam) return false

				const rec = instance.prototype.REC // "0" or "1"
				const isOn = rec === '1'
				return desired === 'on' ? isOn : !isOn
			},
		},

		AutofocusStatus: {
			type: 'boolean',
			name: 'Autofocus status',
			description: 'Change style when AF is enabled/disabled on this camera',
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(0, 255, 0), // green
			},
			options: [
				{
					type: 'textinput',
					label: 'Camera ID',
					id: 'camera_id',
					default: '1',
				},
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
				const cam = unescape(feedback.options.camera_id)
				const desired = feedback.options.status
				if (self.MIDDLE.CAM != cam) return false

				const af = instance.prototype.AF // "0" or "1"
				const isOn = af === '1'
				return desired === 'on' ? isOn : !isOn
			},
		},

		DigitalZoomStatus: {
			type: 'boolean',
			name: 'Digital zoom status',
			description: 'Change style when digital zoom is enabled/disabled',
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(0, 0, 255), // blue
			},
			options: [
				{
					type: 'textinput',
					label: 'Camera ID',
					id: 'camera_id',
					default: '1',
				},
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
				const cam = unescape(feedback.options.camera_id)
				const desired = feedback.options.status
				if (self.MIDDLE.CAM != cam) return false

				const dz = instance.prototype.DZOOM // "0" or "1"
				const isOn = dz === '1'
				return desired === 'on' ? isOn : !isOn
			},
		},

		CurrentPresetActive: {
			type: 'boolean',
			name: 'Currently Active Preset',
			description: 'Change style when a given preset is active on the selected camera',
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(255, 255, 0), // yellow when active
			},
			options: [
				{
					type: 'textinput',
					label: 'Camera ID',
					id: 'camera_id',
					default: '1',
				},
				{
					type: 'number',
					label: 'Preset number (0 = none active)',
					id: 'preset',
					default: 1,
					min: 0,
					max: 12,
					range: true,
				},
			],
			callback: function (feedback) {
				const cam = unescape(feedback.options.camera_id)
				const desiredPreset = String(feedback.options.preset) // convert to string to match PRES_ACTIVE#

				// Only applies to the currently selected camera
				if (self.MIDDLE.CAM != cam) return false

				const activePreset = instance.prototype.PRESET_ACTIVE || '' // "0".."12"
				return activePreset === desiredPreset
			},
		},
	}
}
