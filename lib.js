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
		const c = ch.charCodeAt(0)
		if (c > 0x1f && c !== 0x7f) out += ch
	}
	return out
}
