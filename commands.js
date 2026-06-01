// commands.js — single source of truth for BUILDING Middle Control wire commands.
//
// The static command tokens themselves live in the CHOICES_* dropdown arrays in
// actions.js (those are UI choice lists whose ids are the wire tokens). This file
// owns the *construction* of the templated/parameterised commands so the format
// strings aren't scattered across action callbacks, and so the optional camera
// target ("@C<n>") suffix is applied one consistent way everywhere.
//
// Builders return a ready-to-send string, or `null` when the input is invalid
// (non-numeric where a number is required). Callers must skip the send on null.
// For valid input the output is byte-identical to the previous inline code.

// Accept a trimmed signed integer string -> Number, else null. Mirrors what the
// Middle Control app can actually parse for these integer commands (it uses
// Int(...) / Double(...) and silently drops anything non-numeric).
export function toInt(raw) {
	const s = String(raw ?? '').trim()
	if (!/^-?\d+$/.test(s)) return null
	return parseInt(s, 10)
}

function clamp(n, min, max) {
	return Math.min(max, Math.max(min, n))
}

// Append "@C<digits>" when a camera number is supplied. Digits-only: matches the
// strictest of the previous callbacks (sendcameracommand stripped non-digits;
// the others were UI-regex-guarded to digits), so it's a no-op for valid input
// and just hardens the gimbal/speed paths against variable-injected junk.
export function withCamera(cmd, camRaw) {
	const digits = String(camRaw ?? '').replace(/[^\d]/g, '')
	return digits !== '' ? `${cmd}@C${digits}` : cmd
}

// CAM<id> — select the active camera. (selectcameraID)
// Preserves exact value; rejects non-numeric.
export function selectCamera(idRaw) {
	const n = toInt(idRaw)
	if (n === null) return null
	return `CAM${n}`
}

// PRESET<n>C<id> (recall) / SPRESET<n>C<id> (save). (preset)
// mode: 'RECALL' | 'SAVE'. Rejects if either number is non-numeric.
export function preset(mode, numberRaw, camIdRaw) {
	const num = toInt(numberRaw)
	const cam = toInt(camIdRaw)
	if (num === null || cam === null) return null
	const prefix = mode === 'SAVE' ? 'SPRESET' : 'PRESET'
	return `${prefix}${num}C${cam}`
}

// PRES_D<duration>. (preset_transition)
// Duration may be fractional seconds, so accept any finite number; reject junk.
export function presetTransition(durRaw) {
	const s = String(durRaw ?? '').trim()
	const n = Number(s)
	if (s === '' || !Number.isFinite(n)) return null
	return `PRES_D${s}` // keep the user's exact numeric text (e.g. "1.5")
}

// PTS<v> (Pan/Tilt) / ZS<v> (Zoom) speed, 0..100. (setspeed)
// mode: 'PanTilt' | 'Zoom'. Clamps to the UI-declared 0..100; rejects non-numeric.
export function setSpeed(mode, valueRaw, camRaw) {
	const n = toInt(valueRaw)
	if (n === null) return null
	const v = clamp(n, 0, 100)
	const cmd = (mode === 'Zoom' ? 'ZS' : 'PTS') + v
	return withCamera(cmd, camRaw)
}

// aGLOB;aP<pan>;aT<tilt>;aR<roll>;aZ<zoom>;<duration>. (sendabs)
// Advanced/custom absolute positioning — preserves the exact field text (values
// may be signed/fractional, and the app clamps server-side). No rejection so the
// "always send all fields" behaviour is unchanged.
export function absGimbal({ pan, tilt, roll, zoom, duration }) {
	return `aGLOB;aP${pan};aT${tilt};aR${roll};aZ${zoom};${duration}`
}
