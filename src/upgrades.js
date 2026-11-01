// Upgrade scripts — Companion runs each one once per connection when the module version advances
// (and when an older config is imported), over the actions and feedbacks stored on buttons.
//
// Why they exist: a new option only gets its default when an action is CREATED. An action saved by
// an older version of the module simply doesn't have the key, so it reads as undefined — a checkbox
// shows unticked and a dropdown shows nothing — until the user touches it. Each script below fills
// in what its version added, so old buttons behave exactly like freshly created ones.
//
// Rules: never remove or reorder a script (Companion remembers how many have run per connection);
// a script that is no longer needed is replaced by EmptyUpgradeScript from '@companion-module/base'.
import { RECALL_SETTINGS } from './actions.js'

// 4.0.0 — Recall/Save Preset gained "Settings to recall" (Same as Middle Control / Custom) and six
// tick boxes that default to ticked. Fill them in on actions saved before that.
export function fillPresetRecallDefaults(action) {
	if (action.actionId !== 'preset') return false
	if (!action.options) action.options = {}
	let changed = false
	const fill = (key, value) => {
		if (action.options[key] === undefined) {
			action.options[key] = value
			changed = true
		}
	}
	fill('id_presetrecall', 'app')
	for (const s of RECALL_SETTINGS) fill(s.id, true)
	return changed
}

// 3.2.0 – 3.2.1 shipped "Send Gimbal Action" with the LABEL 'Pan Left' as its default instead of the
// id 'PAN_L'. 3.2.2 fixed the default for new buttons only: a button created on 3.2.x and left on its
// default still stores 'Pan Left', which Middle Control ignores. Map it to the id it meant.
export function fixLegacyGimbalDefault(action) {
	if (action.actionId !== 'sendgimbalcommand') return false
	if (!action.options || action.options.id_sendgimbalcommand !== 'Pan Left') return false
	action.options.id_sendgimbalcommand = 'PAN_L'
	return true
}

const forActions = (fix) =>
	function (_context, props) {
		const updatedActions = []
		for (const action of props.actions) {
			if (fix(action)) updatedActions.push(action)
		}
		return { updatedConfig: null, updatedActions, updatedFeedbacks: [] }
	}

export const UpgradeScripts = [
	// 1 — 4.0.0: preset recall settings
	forActions(fillPresetRecallDefaults),
	// 2 — 4.0.0: gimbal buttons created on 3.2.0 / 3.2.1 with the broken default
	forActions(fixLegacyGimbalDefault),
]
