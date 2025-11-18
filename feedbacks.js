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
				bgcolor: combineRgb(255, 0, 0), // red when condition is true
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
			],
			callback: function (feedback) {

				const desired = feedback.options.status // 'on' or 'off'
				const rec = self.MIDDLE.REC // "0" or "1" or undefined

				if (rec === undefined) return false

				const isOn = rec === '1'
				return desired === 'on' ? isOn : !isOn
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
