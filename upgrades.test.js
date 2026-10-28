import { test } from 'node:test'
import assert from 'node:assert/strict'
import { UpgradeScripts, fillPresetRecallDefaults, fixLegacyGimbalDefault } from './upgrades.js'

const RECALL_KEYS = [
	'id_recall_pt',
	'id_recall_zoom',
	'id_recall_focus',
	'id_recall_iris',
	'id_recall_iso',
	'id_recall_wb',
]

const oldPresetAction = () => ({
	id: 'a1',
	controlId: 'bank:1',
	actionId: 'preset',
	// exactly what a 3.x button stored: no recall settings at all
	options: { id_presetcameraID: '1', id_presetnumber: '3', id_presetmode: 'RECALL' },
})

test('fillPresetRecallDefaults: a 3.x preset action gets "Same as Middle Control" and every box ticked', () => {
	const a = oldPresetAction()
	assert.equal(fillPresetRecallDefaults(a), true)
	assert.equal(a.options.id_presetrecall, 'app')
	for (const k of RECALL_KEYS) assert.equal(a.options[k], true, k)
	// the old keys are untouched
	assert.equal(a.options.id_presetnumber, '3')
	assert.equal(a.options.id_presetmode, 'RECALL')
})

test('fillPresetRecallDefaults: an action that already has the settings is left alone', () => {
	const a = oldPresetAction()
	a.options.id_presetrecall = 'custom'
	for (const k of RECALL_KEYS) a.options[k] = k === 'id_recall_wb'
	assert.equal(fillPresetRecallDefaults(a), false)
	assert.equal(a.options.id_presetrecall, 'custom')
	assert.equal(a.options.id_recall_wb, true)
	assert.equal(a.options.id_recall_pt, false) // an explicit "unticked" must not be flipped
})

test('fillPresetRecallDefaults: only the preset action is touched', () => {
	const a = { id: 'a2', controlId: 'bank:2', actionId: 'selectcameraID', options: { id_selectcameraID: '2' } }
	assert.equal(fillPresetRecallDefaults(a), false)
	assert.deepEqual(a.options, { id_selectcameraID: '2' })
})

test('UpgradeScripts[0]: reports only the actions it changed', () => {
	const changed = oldPresetAction()
	const untouched = { id: 'a3', controlId: 'bank:3', actionId: 'stoppreset', options: {} }
	const result = UpgradeScripts[0](
		{ currentConfig: {} },
		{ config: null, actions: [changed, untouched], feedbacks: [] }
	)
	assert.deepEqual(result.updatedActions, [changed])
	assert.deepEqual(result.updatedFeedbacks, [])
	assert.equal(result.updatedConfig, null)
	assert.equal(changed.options.id_recall_iso, true)
})

// --- script 2: the 3.2.0 / 3.2.1 "Pan Left" default ---
test('fixLegacyGimbalDefault: a 3.2.x gimbal button left on its default now sends PAN_L', () => {
	const a = {
		id: 'g1',
		controlId: 'bank:4',
		actionId: 'sendgimbalcommand',
		options: { id_sendgimbalcommand: 'Pan Left' },
	}
	assert.equal(fixLegacyGimbalDefault(a), true)
	assert.equal(a.options.id_sendgimbalcommand, 'PAN_L')
})

test('fixLegacyGimbalDefault: a real choice, another action, or missing options are left alone', () => {
	const ok = {
		id: 'g2',
		controlId: 'bank:5',
		actionId: 'sendgimbalcommand',
		options: { id_sendgimbalcommand: 'TILT_U' },
	}
	assert.equal(fixLegacyGimbalDefault(ok), false)
	assert.equal(ok.options.id_sendgimbalcommand, 'TILT_U')
	const other = {
		id: 'g3',
		controlId: 'bank:6',
		actionId: 'sendcameracommand',
		options: { id_sendcameracommand: 'Pan Left' },
	}
	assert.equal(fixLegacyGimbalDefault(other), false)
	assert.equal(fixLegacyGimbalDefault({ id: 'g4', controlId: 'bank:7', actionId: 'sendgimbalcommand' }), false)
})

test('UpgradeScripts: two scripts, each reporting only what it changed', () => {
	assert.equal(UpgradeScripts.length, 2)
	const gimbal = {
		id: 'g5',
		controlId: 'bank:8',
		actionId: 'sendgimbalcommand',
		options: { id_sendgimbalcommand: 'Pan Left' },
	}
	const preset = oldPresetAction()
	const r1 = UpgradeScripts[0]({ currentConfig: {} }, { config: null, actions: [gimbal, preset], feedbacks: [] })
	const r2 = UpgradeScripts[1]({ currentConfig: {} }, { config: null, actions: [gimbal, preset], feedbacks: [] })
	assert.deepEqual(r1.updatedActions, [preset])
	assert.deepEqual(r2.updatedActions, [gimbal])
})
