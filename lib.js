// Pure, dependency-free helpers shared by index.js and the unit tests.
// Keeping these out of index.js means tests can import them without triggering
// runEntrypoint() (which would start the module IPC).

// Convert a raw protocol value to a Number, or the '-' sentinel when the camera
// reports the parameter as AUTO / unavailable. Middle Control sends '-' (or a
// non-numeric token) for AUTO White Balance / Tint / Gain / Iris / Shutter etc.;
// without this, parseFloat('-') would surface as 'NaN' in the Companion variable.
// Note: a real negative value (e.g. gain '-12' dB) is preserved as a number;
// only a bare '-' / empty / non-numeric token becomes the AUTO sentinel.
export function numOrAuto(raw) {
	const s = String(raw).trim()
	if (s === '' || s === '-') return '-'
	const n = parseFloat(s)
	return Number.isFinite(n) ? n : '-'
}

// Parse the inside of a list token like "REC_LIST[4,7,8]" -> [4, 7, 8].
// `inner` is the already-extracted content between the brackets (may be '').
// An empty list must yield [] (not [0]): ''.split(',') is [''], and Number('')
// is 0, which previously produced a phantom "[0]" entry.
export function parseList(inner) {
	const s = String(inner).trim()
	if (s === '') return []
	return s
		.split(',')
		.map((v) => Number(v.trim()))
		.filter((n) => !Number.isNaN(n))
}

// Reassemble a TCP byte stream into complete frames. The app emits one
// '{...}\n' frame per tick, but TCP may coalesce or split packets, so callers
// must buffer across chunks and split on '\n'. Returns { frames, rest }:
//   frames - array of frame bodies with the surrounding { } stripped, in order
//   rest   - leftover partial data to carry into the next call
// Empty frames are skipped. Pass the previous `rest` as `buffer` next time.
export function reassembleFrames(buffer, chunk) {
	let buf = (buffer || '') + chunk
	const frames = []
	let idx
	while ((idx = buf.indexOf('\n')) >= 0) {
		const line = buf.slice(0, idx)
		buf = buf.slice(idx + 1)
		const body = line.trim().replace(/^\{/, '').replace(/\}$/, '')
		if (body) frames.push(body)
	}
	return { frames, rest: buf }
}

// Strip frame-breaking control chars (newline/CR/NUL/other C0 + DEL) from an
// outgoing command so a value resolved from a Companion variable cannot inject a
// second command or corrupt the frame. ';' is a legitimate field separator
// (e.g. aGLOB) and is preserved. Returns '' if nothing printable remains.
export function sanitizeCommand(cmd) {
	let out = ''
	for (const ch of String(cmd)) {
		const c = ch.codePointAt(0)
		// The wire protocol is ASCII text: keep only printable ASCII (0x20–0x7E).
		// This drops C0 controls and DEL AND anything above 0x7E — critical because
		// index.js encodes the outgoing buffer as 'latin1', whose encoder masks each
		// code unit with & 0xFF: a non-Latin-1 char like U+200A would otherwise land
		// on the wire as raw 0x0A (newline) and split one command into two. ';' (0x3B)
		// is printable and preserved as the legitimate aGLOB field separator.
		if (c >= 0x20 && c <= 0x7e) out += ch
	}
	return out
}

// ---------------------------------------------------------------------------
// Feed-frame parsing (table-driven).
// A frame body is ';'-separated tokens: 'CAM1', 'REC0', 'aWB5600', 'REC_LIST[1,2]' …
// Each token is matched against the known prefixes LONGEST FIRST and anchored at
// the token start, so 'aISO32' can never be mistaken for 'aI', nor
// 'CAM_CON_LIST[…]' for 'CAM'. The first occurrence of a key wins. Unknown tokens
// ('aUI', 'BRANG_RUN', future additions) are ignored — never an error.

const NUMERIC_TOKENS = [
	'PTS',
	'ZS',
	'SS',
	'PRES_D',
	'PRES_C',
	'PRES_E',
	'aWB',
	'aF',
	'aI',
	'aTINT',
	'aISO',
	'aSHUT',
	'aSAT',
	'aCONT',
	'aBLACKLEV',
	'aMIDLEV',
	'aWHITELEV',
	'aPAN',
	'aTILT',
	'aROLL',
	'aZOOM',
	'aSLIDER',
]
const TOKEN_SPECS = [
	{ key: 'REC_LIST', prefix: 'REC_LIST[', type: 'list' },
	{ key: 'CAM_CON_LIST', prefix: 'CAM_CON_LIST[', type: 'list' },
	{ key: 'APCR_CON_LIST', prefix: 'APCR_CON_LIST[', type: 'list' },
	{ key: 'CAM', prefix: 'CAM', type: 'str' },
	{ key: 'REC', prefix: 'REC', type: 'str' },
	{ key: 'AF', prefix: 'AF', type: 'str' },
	{ key: 'DZOOM', prefix: 'DZOOM', type: 'str' },
	{ key: 'PRES_ACTIVE', prefix: 'PRES_ACTIVE', type: 'str' },
	{ key: 'SHAKE_RUN', prefix: 'SHAKE_RUN', type: 'str' },
	{ key: 'ZLOOP_RUN', prefix: 'ZLOOP_RUN', type: 'str' },
	{ key: 'PRESETSEQ_RUN', prefix: 'PRESETSEQ_RUN', type: 'str' },
	{ key: 'PRESETSEQ_BANK', prefix: 'PRESETSEQ_BANK', type: 'str' },
	{ key: 'SEL', prefix: 'SEL', type: 'str' },
	{ key: 'aND', prefix: 'aND', type: 'nd' },
	...NUMERIC_TOKENS.map((k) => ({ key: k, prefix: k, type: 'num' })),
].sort((a, b) => b.prefix.length - a.prefix.length)

// ND filter token value → 'CLEAR' (no filter, or the camera has none: '' / '-') or the denominator text.
export function normaliseND(raw) {
	const s = String(raw ?? '').trim()
	return s === '' || s === '-' ? 'CLEAR' : s
}

export function parseFrame(body) {
	const out = {}
	for (const tok of String(body ?? '').split(';')) {
		if (!tok) continue
		const spec = TOKEN_SPECS.find((s) => tok.startsWith(s.prefix))
		if (!spec || out[spec.key] !== undefined) continue
		const raw = tok.slice(spec.prefix.length)
		if (spec.type === 'list') out[spec.key] = parseList(raw.endsWith(']') ? raw.slice(0, -1) : raw)
		else if (spec.type === 'num') out[spec.key] = numOrAuto(raw)
		else if (spec.type === 'nd') out[spec.key] = normaliseND(raw)
		else out[spec.key] = raw
	}
	return out
}

// Does this frame carry any "selected camera" marker the app can emit?
//  - SEL<0|1>: explicit flag (Middle Control 4.1 builds from 2026-10-28): SEL1 on the selected
//    camera's frame, SEL0 on the other cameras' frames.
//  - PRES_ACTIVE / PRES_C: only ever present in the selected camera's frame (every version).
export function hasSelMarker(p) {
	return p.SEL !== undefined || p.PRES_ACTIVE !== undefined || p.PRES_C !== undefined
}

// Is this frame about the camera currently SELECTED in Middle Control?
//  - trackAll off (default): yes, always — the app only ever sends the selected camera's frame.
//    That is true for every Middle Control version, so this is the legacy-safe path.
//  - trackAll on (FEED_ALL1, Middle Control 4.1+): the app also sends one frame per connected
//    camera. SEL decides when present. Without SEL (earlier 4.1 builds) only the selected camera's
//    frame carries PRES_ACTIVE (or PRES_C — PRES_C alone was not enough: the app only sends it when
//    the selected camera is an IP camera, so ATEM / gimbal-only setups had no marker at all).
//    If this connection has never seen any marker, the app is an older version that ignores
//    FEED_ALL1, so every frame is still the selected camera.
export function isSelectedFrame(parsed, trackAll, seenMarker) {
	if (!trackAll) return true
	if (parsed.SEL !== undefined) return parsed.SEL === '1'
	if (parsed.PRES_ACTIVE !== undefined || parsed.PRES_C !== undefined) return true
	return !seenMarker
}

// Cameras whose last frame is older than ttlMs. The app simply stops describing a camera that
// disconnects (and sends no per-camera frames once "Monitor all cameras" is off), so without this
// their last values would linger forever. lastSeen: { camId: timestampMs }.
export function expiredCams(lastSeen, now, ttlMs) {
	return Object.keys(lastSeen).filter((cam) => now - lastSeen[cam] > ttlMs)
}

const dash = (x) => (x === undefined ? '-' : x)
const shutterText = (x) => (x === undefined || x === '-' ? dash(x) : '1/' + x)

// Parsed frame → the per-camera state object that feedbacks and send() read. The field names are
// the historical this.MIDDLE contract and must not change.
export function toState(p) {
	return {
		CAM: p.CAM,
		REC: p.REC,
		AF: p.AF,
		DZOOM: p.DZOOM,
		PRESET_ACTIVE: p.PRES_ACTIVE,
		PTS: p.PTS,
		ZS: p.ZS,
		REC_LIST: p.REC_LIST ?? [],
		CAM_CON_LIST: p.CAM_CON_LIST ?? [],
		APCR_CON_LIST: p.APCR_CON_LIST ?? [],
		SHAKE_RUN: p.SHAKE_RUN,
		ZLOOP_RUN: p.ZLOOP_RUN,
		PRESETSEQ_RUN: p.PRESETSEQ_RUN,
		SEQ_BANK: p.PRESETSEQ_BANK,
		ND: p.aND,
		aI: p.aI,
		aSAT: p.aSAT,
		aCONT: p.aCONT,
		aBLEV: p.aBLACKLEV,
		aMLEV: p.aMIDLEV,
		aWLEV: p.aWHITELEV,
	}
}

// Parsed frame → the selected-camera variables. A token missing from the frame reads '-' (the
// same placeholder as at startup and on disconnect), replacing the old mix of '', '-' and stale.
export function toVars(p) {
	return {
		CAM_var: dash(p.CAM),
		PTS_var: dash(p.PTS),
		ZS_var: dash(p.ZS),
		SS_var: dash(p.SS),
		PRES_D_var: dash(p.PRES_D),
		PRES_E_var: dash(p.PRES_E),
		PRES_C_var: dash(p.PRES_C),
		aWB_var: dash(p.aWB),
		aTINT_var: dash(p.aTINT),
		aISO_var: dash(p.aISO),
		aI_var: dash(p.aI),
		aND_var: dash(p.aND),
		aSHUT_var: shutterText(p.aSHUT),
		aCONT_var: dash(p.aCONT),
		aSAT_var: dash(p.aSAT),
		aBLACKLEV_var: dash(p.aBLACKLEV),
		aMIDLEV_var: dash(p.aMIDLEV),
		aWHITELEV_var: dash(p.aWHITELEV),
		aF_var: dash(p.aF),
		aPAN_var: dash(p.aPAN),
		aTILT_var: dash(p.aTILT),
		aROLL_var: dash(p.aROLL),
		aZOOM_var: dash(p.aZOOM),
		aSLIDER_var: dash(p.aSLIDER),
		REC_var: dash(p.REC),
		AF_var: dash(p.AF),
		DZOOM_var: dash(p.DZOOM),
		PRESET_ACTIVE_var: dash(p.PRES_ACTIVE),
		LIST_CAM_CON_var: p.CAM_CON_LIST ? p.CAM_CON_LIST.join(',') : '-',
		LIST_REC_var: p.REC_LIST ? p.REC_LIST.join(',') : '-',
		LIST_APCR_CON_var: p.APCR_CON_LIST ? p.APCR_CON_LIST.join(',') : '-',
		SHAKE_RUN_var: dash(p.SHAKE_RUN),
		ZLOOP_RUN_var: dash(p.ZLOOP_RUN),
		PRESETSEQ_RUN_var: dash(p.PRESETSEQ_RUN),
		SEQ_BANK_var: dash(p.PRESETSEQ_BANK),
	}
}

// Per-camera variables (only when "Monitor all cameras" is on): cam<N>_<suffix>.
export const CAM_VAR_FIELDS = [
	{ suffix: 'rec', key: 'REC', label: 'Recording (0/1)' },
	{ suffix: 'af', key: 'AF', label: 'AutoFocus (0/1)' },
	{ suffix: 'dzoom', key: 'DZOOM', label: 'Digital Zoom (0/1)' },
	{ suffix: 'preset', key: 'PRES_ACTIVE', label: 'Active preset (0 = none)' },
	{ suffix: 'shake', key: 'SHAKE_RUN', label: 'Camera Shake running (0/1)' },
	{ suffix: 'zloop', key: 'ZLOOP_RUN', label: 'Zoom Loop running (0/1)' },
	{ suffix: 'presetseq', key: 'PRESETSEQ_RUN', label: 'Presets Sequence running (0/1)' },
	{ suffix: 'nd', key: 'aND', label: 'ND filter' },
	{ suffix: 'wb', key: 'aWB', label: 'White Balance' },
	{ suffix: 'tint', key: 'aTINT', label: 'Tint' },
	{ suffix: 'iso', key: 'aISO', label: 'Gain (dB)' },
	{ suffix: 'iris', key: 'aI', label: 'Iris' },
	{ suffix: 'shutter', key: 'aSHUT', label: 'Shutter' },
	{ suffix: 'focus', key: 'aF', label: 'Focus' },
]

export function toCamVars(cam, p) {
	const out = {}
	for (const f of CAM_VAR_FIELDS) {
		out[`cam${cam}_${f.suffix}`] = f.key === 'aSHUT' ? shutterText(p.aSHUT) : dash(p[f.key])
	}
	return out
}
