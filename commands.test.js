import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toInt, withCamera, selectCamera, preset, presetTransition, setSpeed, absGimbal } from './commands.js'

// --- toInt ---
test('toInt: accepts signed integers, rejects junk', () => {
	assert.equal(toInt('5'), 5)
	assert.equal(toInt(' 12 '), 12)
	assert.equal(toInt('-3'), -3)
	assert.equal(toInt(''), null)
	assert.equal(toInt('1.5'), null) // not an integer
	assert.equal(toInt('abc'), null)
	assert.equal(toInt('5x'), null)
	assert.equal(toInt(undefined), null)
})

// --- withCamera: digits-only "@C<n>" suffix, applied one way everywhere ---
test('withCamera: appends @C<digits> only when a number is given', () => {
	assert.equal(withCamera('AUTOFOCUS', ''), 'AUTOFOCUS')
	assert.equal(withCamera('AUTOFOCUS', '3'), 'AUTOFOCUS@C3')
	assert.equal(withCamera('PAN_L', '12'), 'PAN_L@C12')
})
test('withCamera: strips non-digits (injection / stray chars)', () => {
	assert.equal(withCamera('AUTOFOCUS', ' 3 '), 'AUTOFOCUS@C3')
	assert.equal(withCamera('AUTOFOCUS', 'abc'), 'AUTOFOCUS') // nothing numeric -> no suffix
	assert.equal(withCamera('AUTOFOCUS', '3;REC_STOP'), 'AUTOFOCUS@C3') // can't inject
})

// --- selectCamera: CAM<id> (byte-identical to old 'CAM'+value for valid input) ---
test('selectCamera: builds CAM<id>, rejects non-numeric', () => {
	assert.equal(selectCamera('5'), 'CAM5')
	assert.equal(selectCamera('1'), 'CAM1')
	assert.equal(selectCamera(''), null)
	assert.equal(selectCamera('x'), null)
})

// --- preset: PRESET<n>C<id> / SPRESET<n>C<id> ---
test('preset: recall and save formats', () => {
	assert.equal(preset('RECALL', '8', '5'), 'PRESET8C5')
	assert.equal(preset('SAVE', '8', '5'), 'SPRESET8C5')
	assert.equal(preset('RECALL', '1', '1'), 'PRESET1C1')
})
test('preset: rejects non-numeric number or camera id', () => {
	assert.equal(preset('RECALL', '', '5'), null)
	assert.equal(preset('RECALL', '8', ''), null)
	assert.equal(preset('SAVE', 'x', '5'), null)
})

// --- presetTransition: PRES_D<duration>, keeps exact numeric text ---
test('presetTransition: keeps the exact numeric text (incl. decimals)', () => {
	assert.equal(presetTransition('1'), 'PRES_D1')
	assert.equal(presetTransition('1.5'), 'PRES_D1.5')
	assert.equal(presetTransition('0'), 'PRES_D0')
	assert.equal(presetTransition(''), null)
	assert.equal(presetTransition('abc'), null)
})

// --- setSpeed: PTS<v> / ZS<v>, clamp 0..100, optional @C ---
test('setSpeed: PanTilt -> PTS, Zoom -> ZS', () => {
	assert.equal(setSpeed('PanTilt', '100', ''), 'PTS100')
	assert.equal(setSpeed('Zoom', '50', ''), 'ZS50')
})
test('setSpeed: clamps to 0..100', () => {
	assert.equal(setSpeed('PanTilt', '250', ''), 'PTS100')
	assert.equal(setSpeed('PanTilt', '-5', ''), 'PTS0')
})
test('setSpeed: optional camera suffix; rejects non-numeric', () => {
	assert.equal(setSpeed('PanTilt', '80', '3'), 'PTS80@C3')
	assert.equal(setSpeed('Zoom', '40', '12'), 'ZS40@C12')
	assert.equal(setSpeed('PanTilt', '', ''), null)
	assert.equal(setSpeed('PanTilt', 'x', ''), null)
})

// --- absGimbal: exact aGLOB template, all fields always present ---
test('absGimbal: builds the exact aGLOB frame', () => {
	assert.equal(absGimbal({ pan: '0', tilt: '0', roll: '0', zoom: '0', duration: '1' }), 'aGLOB;aP0;aT0;aR0;aZ0;1')
	assert.equal(
		absGimbal({ pan: '-100', tilt: '200', roll: '5', zoom: '4096', duration: '2' }),
		'aGLOB;aP-100;aT200;aR5;aZ4096;2'
	)
})
