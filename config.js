import { Regex } from '@companion-module/base'

// Sentinel id for "type the IP myself" in the device dropdown.
export const MANUAL = 'manual'

const INFO_FIELD = {
	type: 'static-text',
	id: 'info',
	label: 'Information',
	width: 12,
	value:
		'Controls the **Middle Control** software. \n\n' +
		'Instructions & ready-to-go Companion pages: [middlethings.co/companion](https://www.middlethings.co/companion)\n\n' +
		'Pick your Middle Control below. Instances found on the network appear automatically; ' +
		'choose **Manual** to type an IP (use **127.0.0.1** when Middle Control runs on this same computer). \n\n' +
		'- Middle Control must be running (on this computer, or any computer on this network)\n' +
		'- Controlling gimbal movement requires an APC-R / APC-R Mini / APC-R Mini Lite\n \n' +
		'Questions? Contact **support@middlethings.co**',
}

const PROT_FIELD = {
	type: 'dropdown',
	id: 'prot',
	label: 'Middle Control Software Version',
	default: 'tcp',
	choices: [{ id: 'tcp', label: 'Latest' }],
}

// Build the config panel, ATEM-style: ONE "Middle Control" dropdown is the
// single source of truth — "Manual" plus every instance discovered on the LAN
// (see discovery.js). The Target IP field only appears when "Manual" is chosen
// (via isVisible), so there is never a second, contradictory IP on screen.
export function buildConfigFields(discoveredChoices = []) {
	const deviceField = {
		type: 'dropdown',
		id: 'device',
		label: 'Middle Control',
		width: 6,
		default: MANUAL,
		tooltip: 'Instances found on your network appear here automatically. Choose Manual to type an IP.',
		choices: [{ id: MANUAL, label: 'Manual IP Address' }, ...discoveredChoices],
	}

	const hostField = {
		type: 'textinput',
		id: 'host',
		label: 'Target IP',
		width: 6,
		regex: Regex.IP,
		// Editable only in Manual mode. (Companion config forms can't render a
		// disabled/greyed input — only show/hide — so when a discovered instance
		// is selected we swap this editable box for the locked line below.)
		// NOTE: isVisible runs in an ISOLATED scope on the client — it must not
		// reference anything outside itself (the MANUAL const would be undefined
		// there), so the sentinel is inlined as the literal 'manual'.
		isVisible: (opts) => opts.device === 'manual' || opts.device === undefined,
	}

	// Stands in for the greyed-out Target IP when a discovered instance is chosen,
	// so the row doesn't just vanish and the user sees why it isn't editable.
	const hostLocked = {
		type: 'static-text',
		id: 'host_locked',
		label: 'Target IP',
		width: 6,
		value: '🔒 Using the selected Middle Control instance. Switch to Manual to type an IP.',
		isVisible: (opts) => opts.device !== 'manual' && opts.device !== undefined,
	}

	// Shown only while nothing has been found yet, so a first-time user knows
	// detection is running rather than staring at just "Manual".
	const searchingHint = {
		type: 'static-text',
		id: 'disc_hint',
		width: 12,
		label:
			'🔎 Searching for Middle Control on the network… detected instances appear in the dropdown above automatically (within ~10 s). Re-open this dialog to refresh, or just use Manual.',
		isVisible: (opts) => opts.device === 'manual' || opts.device === undefined,
	}

	const fields = [INFO_FIELD, deviceField, hostField, hostLocked]
	if (discoveredChoices.length === 0) fields.push(searchingHint)
	fields.push(PROT_FIELD)
	return fields
}

// Static fallback (no discovery) — kept for compatibility.
export const ConfigFields = buildConfigFields([])
