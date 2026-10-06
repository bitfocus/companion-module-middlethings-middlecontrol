import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
	toInt,
	withCamera,
	selectCamera,
	preset,
	presetTransition,
	setSpeed,
	absGimbal,
	stopPreset,
	automation,
	focusStep,
	presetEase,
	ndFilter,
} from './commands.js'

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

// --- stopPreset: bare STOPPRESET, or STOPPRESET@C<id> when a camera is given ---
test('stopPreset: bare token with no camera, @C suffix with one', () => {
	assert.equal(stopPreset(), 'STOPPRESET')
	assert.equal(stopPreset(''), 'STOPPRESET')
	assert.equal(stopPreset('5'), 'STOPPRESET@C5')
	assert.equal(stopPreset(' 12 '), 'STOPPRESET@C12')
	assert.equal(stopPreset('3;REC_STOP'), 'STOPPRESET@C3') // digits-only, can't inject
})

// --- absGimbal: exact aGLOB template, all fields always present ---
test('absGimbal: builds the exact aGLOB frame', () => {
	assert.equal(absGimbal({ pan: '0', tilt: '0', roll: '0', zoom: '0', duration: '1' }), 'aGLOB;aP0;aT0;aR0;aZ0;1')
	assert.equal(
		absGimbal({ pan: '-100', tilt: '200', roll: '5', zoom: '4096', duration: '2' }),
		'aGLOB;aP-100;aT200;aR5;aZ4096;2'
	)
})

// --- automation: type+op → wire command, optional @C, value ops require a number ---
test('automation: start/stop take no value', () => {
	assert.equal(automation('shake', 'start', '', ''), 'SHAKE-START')
	assert.equal(automation('shake', 'stop', '', ''), 'SHAKE-STOP')
	assert.equal(automation('zloop', 'start', '', ''), 'ZLOOP-START')
	assert.equal(automation('presetseq', 'stop', '', ''), 'PRESETSEQ-STOP')
})
test('automation: value ops append the exact numeric text', () => {
	assert.equal(automation('shake', 'speed', '50', ''), 'SHAKE-SPEED50')
	assert.equal(automation('shake', 'ampl', '30', '3'), 'SHAKE-AMPL30@C3')
	assert.equal(automation('zloop', 'speed', '80', ''), 'ZLOOP-SPEED80')
	assert.equal(automation('zloop', 'rest', '2.5', ''), 'ZLOOP-RESTDURATION2.5')
	assert.equal(automation('zloop', 'dur', '10', ''), 'ZLOOP-DURATION10')
	assert.equal(automation('presetseq', 'rest', '1.5', ''), 'PRESETSEQ-RESTDURATION1.5')
	assert.equal(automation('presetseq', 'speed', '2', ''), 'PRESETSEQ-SPEED2')
	assert.equal(automation('presetseq', 'bank', '3', '12'), 'PRESETSEQ-BANK3@C12')
})
test('automation: optional @C only when a camera is given', () => {
	assert.equal(automation('presetseq', 'start', '', '5'), 'PRESETSEQ-START@C5')
	assert.equal(automation('presetseq', 'start', '', ''), 'PRESETSEQ-START')
})
test('automation: rejects missing/non-numeric value and bad type/op', () => {
	assert.equal(automation('shake', 'speed', '', ''), null)
	assert.equal(automation('shake', 'speed', 'abc', ''), null)
	assert.equal(automation('bogus', 'start', '', ''), null)
	assert.equal(automation('shake', 'bogus', '', ''), null)
})

// --- focusStep: FOCUS±<size>, exact size text, optional camera ---
test('focusStep: sign from the direction, size forwarded as typed, junk rejected', () => {
	assert.equal(focusStep('in', '0.002', ''), 'FOCUS+0.002')
	assert.equal(focusStep('out', '0.01', '3'), 'FOCUS-0.01@C3')
	assert.equal(focusStep('in', ' 0.5 ', ''), 'FOCUS+0.5')
	assert.equal(focusStep('in', '', ''), null)
	assert.equal(focusStep('in', '0', ''), null)
	assert.equal(focusStep('in', '-0.01', ''), null)
	assert.equal(focusStep('in', 'abc', ''), null)
	assert.equal(focusStep('in', undefined, ''), null)
})

// --- presetEase: PRES_E<0..100>, rounded and clamped ---
test('presetEase: integer 0..100, junk rejected', () => {
	assert.equal(presetEase('50'), 'PRES_E50')
	assert.equal(presetEase(' 88 '), 'PRES_E88')
	assert.equal(presetEase('150'), 'PRES_E100')
	assert.equal(presetEase('-5'), 'PRES_E0')
	assert.equal(presetEase('12.6'), 'PRES_E13')
	assert.equal(presetEase(''), null)
	assert.equal(presetEase('abc'), null)
})

// --- ndFilter: ND<denominator> / NDCLEAR, optional camera ---
test('ndFilter: ladder values, clear, custom denominator, junk rejected', () => {
	assert.equal(ndFilter('CLEAR', '', ''), 'NDCLEAR')
	assert.equal(ndFilter('clear', '', '2'), 'NDCLEAR@C2')
	assert.equal(ndFilter('64', '', ''), 'ND64')
	assert.equal(ndFilter('4', '', '3'), 'ND4@C3')
	assert.equal(ndFilter('custom', '128', ''), 'ND128')
	assert.equal(ndFilter('custom', ' 8 ', '5'), 'ND8@C5')
	assert.equal(ndFilter('custom', '', ''), null)
	assert.equal(ndFilter('custom', '0', ''), null)
	assert.equal(ndFilter('custom', '1/64', ''), null)
	assert.equal(ndFilter('custom', 'abc', ''), null)
})
