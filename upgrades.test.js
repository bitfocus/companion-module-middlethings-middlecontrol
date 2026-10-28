import { test } from 'node:test'
import assert from 'node:assert/strict'
import { UpgradeScripts, fillPresetRecallDefaults } from './upgrades.js'

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
