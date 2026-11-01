import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getFeedbackDefinitions } from './feedbacks.js'
import { parseFrame, toState } from './lib.js'

// A stand-in for the module instance: the selected camera's state plus the per-camera states.
function fakeSelf(mainFrame, camFrames = {}) {
	const camState = {}
	for (const [cam, frame] of Object.entries(camFrames)) camState[cam] = toState(parseFrame(frame))
	return { MIDDLE: toState(parseFrame(mainFrame)), camState }
}
const fb = (options) => ({ options })

test('BatteryLevel: at or below the threshold, unknown never alarms', () => {
	const defs = getFeedbackDefinitions(fakeSelf('CAM1;aBAT15;aPWRB', { 3: 'CAM3;aBAT80;aPWRB', 4: 'CAM4;aBAT-;aPWR-' }))
	const cb = defs.BatteryLevel.callback
	assert.equal(cb(fb({ threshold: 20, camera_id: '' })), true)
	assert.equal(cb(fb({ threshold: 10, camera_id: '' })), false)
	assert.equal(cb(fb({ threshold: 15, camera_id: '' })), true) // "at or below" includes equality
	assert.equal(cb(fb({ camera_id: '' })), true) // no threshold saved yet → 20
	assert.equal(cb(fb({ threshold: 20, camera_id: '3' })), false) // camera 3 at 80 %
	assert.equal(cb(fb({ threshold: 90, camera_id: '3' })), true)
	assert.equal(cb(fb({ threshold: 100, camera_id: '4' })), false) // '-' = no reading, never lit
	assert.equal(cb(fb({ threshold: 100, camera_id: '9' })), false) // unknown camera
	// An app older than 4.1 sends no token at all
	const old = getFeedbackDefinitions(fakeSelf('CAM1;REC0;AF1'))
	assert.equal(old.BatteryLevel.callback(fb({ threshold: 100, camera_id: '' })), false)
})

test('PowerSource: mains or battery, unknown lights nothing', () => {
	const defs = getFeedbackDefinitions(fakeSelf('CAM1;aBAT-;aPWRA', { 2: 'CAM2;aBAT55;aPWRB', 5: 'CAM5;aBAT-;aPWR-' }))
	const cb = defs.PowerSource.callback
	assert.equal(cb(fb({ source: 'A', camera_id: '' })), true)
	assert.equal(cb(fb({ source: 'B', camera_id: '' })), false)
	assert.equal(cb(fb({ source: 'B', camera_id: '2' })), true)
	assert.equal(cb(fb({ source: 'A', camera_id: '2' })), false)
	assert.equal(cb(fb({ source: 'A', camera_id: '5' })), false)
	assert.equal(cb(fb({ source: 'B', camera_id: '5' })), false)
})

test('every feedback is in the FEEDBACK_IDS refresh list of index.js (and nothing stale is)', () => {
	// index.js cannot be imported here (it starts the module), so read the array from its text.
	const src = readFileSync(new URL('./index.js', import.meta.url), 'utf8')
	const m = src.match(/const FEEDBACK_IDS = \[([^\]]*)\]/)
	assert.ok(m, 'FEEDBACK_IDS not found in index.js')
	const listed = [...m[1].matchAll(/'([A-Za-z]+)'/g)].map((x) => x[1]).sort()
	const defined = Object.keys(getFeedbackDefinitions(fakeSelf('CAM1'))).sort()
	assert.deepEqual(listed, defined)
})
