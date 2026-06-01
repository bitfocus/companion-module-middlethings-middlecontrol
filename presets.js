import { combineRgb } from '@companion-module/base'

// Streamdeck+ rotary-encoder presets.
//
// A rotary encoder fires its action ONCE per detent, with no magnitude and no
// release event. So only DISCRETE-STEP commands belong on a knob (one detent =
// one step). Gimbal motion commands (PAN/TILT/ROLL/ZOOM/SLIDER) are intentionally
// NOT offered here: they start continuous motion that needs a separate IDLE on
// release to stop, which an encoder detent cannot provide.
//
// All actionId / option-id / command-id values below are reused verbatim from
// actions.js, and the label variables from variables.js.

const CAT = 'Encoders (Streamdeck+)'
const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)
const GREEN = combineRgb(0, 200, 0)

// Build a camera-step encoder preset (uses the `sendcameracommand` action).
// `down` (press) is optional, e.g. an AUTO toggle.
function cameraEncoder({ title, text, down, left, right, feedbacks }) {
	return {
		type: 'button',
		category: CAT,
		name: title,
		style: { text, size: '14', color: WHITE, bgcolor: BLACK },
		options: { rotaryActions: true },
		steps: [
			{
				down: down
					? [{ actionId: 'sendcameracommand', options: { id_sendcameracommand: down, id_sendcameracommand_camera: '' } }]
					: [],
				up: [],
				rotate_left: [
					{ actionId: 'sendcameracommand', options: { id_sendcameracommand: left, id_sendcameracommand_camera: '' } },
				],
				rotate_right: [
					{ actionId: 'sendcameracommand', options: { id_sendcameracommand: right, id_sendcameracommand_camera: '' } },
				],
			},
		],
		feedbacks: feedbacks ?? [],
	}
}

export function getPresetDefinitions() {
	const presets = {}

	// Focus — rotate to focus, press to toggle Auto Focus (turns green when AF on)
	presets.encoder_focus = cameraEncoder({
		title: 'Focus encoder (rotate = focus, press = Auto Focus)',
		text: 'FOCUS\n$(middlecontrol:aF_var)',
		down: 'AUTOFOCUS',
		left: 'FOCUS-',
		right: 'FOCUS+',
		feedbacks: [
			{
				feedbackId: 'AutofocusStatus',
				options: { status: 'on' },
				style: { color: BLACK, bgcolor: GREEN },
			},
		],
	})

	// Iris — rotate to adjust, press for Auto Iris
	presets.encoder_iris = cameraEncoder({
		title: 'Iris encoder (rotate = iris, press = Auto Iris)',
		text: 'IRIS\nf$(middlecontrol:aI_var)',
		down: 'AUTOIRIS',
		left: 'IRIS-',
		right: 'IRIS+',
	})

	// ISO / Gain — rotate to adjust, press for Auto Gain
	presets.encoder_iso = cameraEncoder({
		title: 'ISO / Gain encoder (rotate = gain, press = Auto Gain)',
		text: 'GAIN\n$(middlecontrol:aISO_var)',
		down: 'AUTOGAIN',
		left: 'ISO-',
		right: 'ISO+',
	})

	// White Balance — rotate to adjust, press for Auto WB
	presets.encoder_wb = cameraEncoder({
		title: 'White Balance encoder (rotate = WB, press = Auto WB)',
		text: 'WB\n$(middlecontrol:aWB_var)K',
		down: 'AUTOWB',
		left: 'WB-',
		right: 'WB+',
	})

	// Shutter — rotate to adjust
	presets.encoder_shutter = cameraEncoder({
		title: 'Shutter encoder (rotate to adjust)',
		text: 'SHUTTER\n$(middlecontrol:aSHUT_var)',
		left: 'SHUTTER-',
		right: 'SHUTTER+',
	})

	// Tint — rotate to adjust
	presets.encoder_tint = cameraEncoder({
		title: 'Tint encoder (rotate to adjust)',
		text: 'TINT\n$(middlecontrol:aTINT_var)',
		left: 'TINT-',
		right: 'TINT+',
	})

	// Zoom Speed — gimbal speed step (uses the `sendgimbalcommand` action)
	presets.encoder_zoomspeed = {
		type: 'button',
		category: CAT,
		name: 'Zoom Speed encoder (rotate to adjust)',
		style: { text: 'ZOOM SPD\n$(middlecontrol:ZS_var)', size: '14', color: WHITE, bgcolor: BLACK },
		options: { rotaryActions: true },
		steps: [
			{
				down: [],
				up: [],
				rotate_left: [
					{
						actionId: 'sendgimbalcommand',
						options: { id_sendgimbalcommand: 'ZSPEED-', id_sendgimbalcommand_camera: '' },
					},
				],
				rotate_right: [
					{
						actionId: 'sendgimbalcommand',
						options: { id_sendgimbalcommand: 'ZSPEED+', id_sendgimbalcommand_camera: '' },
					},
				],
			},
		],
		feedbacks: [],
	}

	return presets
}
