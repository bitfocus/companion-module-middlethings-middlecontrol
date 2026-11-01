import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseBeacon, isIPv4, MiddleDiscovery, BEACON_PREFIX } from './discovery.js'

test('parseBeacon: v2 beacon exposes the selected (operating) IP', () => {
	const b = parseBeacon('middleInstance sel=192.168.4.184 mask=255.255.255.0')
	assert.equal(b.selIp, '192.168.4.184')
	assert.equal(b.mask, '255.255.255.0')
})

test('parseBeacon: legacy bare beacon has no sel (caller falls back to source IP)', () => {
	const b = parseBeacon('middleInstance')
	assert.equal(b.selIp, undefined)
	assert.equal(b.mask, undefined)
})

test('parseBeacon: non-beacon text returns null', () => {
	assert.equal(parseBeacon('hello world'), null)
	assert.equal(parseBeacon(''), null)
	assert.equal(parseBeacon(undefined), null)
})

test('parseBeacon: malformed sel/mask are ignored (only dotted-quad IPv4 surfaces)', () => {
	const b = parseBeacon('middleInstance sel=notanip mask=999.1.1.1')
	assert.equal(b.selIp, undefined)
	assert.equal(b.mask, undefined)
})

test('parseBeacon: tolerates extra whitespace and unknown fields', () => {
	const b = parseBeacon('  middleInstance   sel=10.0.0.5   foo=bar  ')
	assert.equal(b.selIp, '10.0.0.5')
	assert.equal(b.fields.foo, 'bar')
})

test('parseBeacon: decodes percent-encoded name and id', () => {
	const b = parseBeacon('middleInstance sel=192.168.10.46 mask=255.255.255.0 name=Studio%20Mac id=ABC-123')
	assert.equal(b.name, 'Studio Mac')
	assert.equal(b.id, 'ABC-123')
})

test('parseBeacon: name/id are undefined on beacons that lack them', () => {
	const b = parseBeacon('middleInstance sel=10.0.0.5')
	assert.equal(b.name, undefined)
	assert.equal(b.id, undefined)
})

test('isIPv4: accepts dotted quads, rejects junk', () => {
	assert.equal(isIPv4('192.168.1.1'), true)
	assert.equal(isIPv4('0.0.0.0'), true)
	assert.equal(isIPv4('256.1.1.1'), false)
	assert.equal(isIPv4('1.2.3'), false)
	assert.equal(isIPv4('a.b.c.d'), false)
	assert.equal(isIPv4(undefined), false)
})

test('MiddleDiscovery.getChoices: connect target is the REACHABLE source IP, not the camera-VLAN sel', () => {
	const d = new MiddleDiscovery()
	// Multi-homed Mac: operates cameras on 192.168.4.184 (sel) but the beacon
	// reached us from 192.168.10.46 — that source is the address Companion can
	// actually route to, so it (not sel) must be the choice.
	d._onMessage(Buffer.from(`${BEACON_PREFIX} sel=192.168.4.184 mask=255.255.255.0`), { address: '192.168.10.46' })
	d._onMessage(Buffer.from(`${BEACON_PREFIX} sel=192.168.10.199 mask=255.255.255.0`), { address: '192.168.10.199' })
	const choices = d.getChoices()
	// Sorted numerically by IP: .46 before .199. Neither is the sel (192.168.4.184).
	assert.deepEqual(
		choices.map((c) => c.id),
		['192.168.10.46', '192.168.10.199']
	)
	// Labels are just the reachable IP — no confusing "via".
	assert.equal(choices[0].label, '192.168.10.46')
	assert.ok(!choices[0].label.includes('via'))
})

test('MiddleDiscovery: one multi-homed Mac collapses to a SINGLE row, showing its selected IP', () => {
	// Exactly the captured real case: one Mac with sel=192.168.10.199 (its selected
	// LAN) also beacons from its camera VLAN 192.168.4.204. Must dedupe to ONE row
	// and show the selected IP (reachable — we heard a beacon from it), NOT the VLAN.
	const d = new MiddleDiscovery()
	d._onMessage(Buffer.from(`${BEACON_PREFIX} sel=192.168.10.199 mask=255.255.255.0`), { address: '192.168.10.199' })
	d._onMessage(Buffer.from(`${BEACON_PREFIX} sel=192.168.10.199 mask=255.255.255.0`), { address: '192.168.4.204' })
	const choices = d.getChoices()
	assert.equal(choices.length, 1) // one Mac, one row
	assert.equal(choices[0].id, '192.168.10.199') // the selected IP, not the camera VLAN 192.168.4.204
})

test('MiddleDiscovery: named beacons dedupe by id across interfaces and label by name', () => {
	const d = new MiddleDiscovery()
	// Same Mac (id=uuid-A, name "Studio Mac"), selected IP 192.168.10.46, also heard
	// from its camera VLAN 192.168.4.184.
	d._onMessage(Buffer.from(`${BEACON_PREFIX} sel=192.168.10.46 mask=255.255.255.0 name=Studio%20Mac id=uuid-A`), {
		address: '192.168.10.46',
	})
	d._onMessage(Buffer.from(`${BEACON_PREFIX} sel=192.168.10.46 mask=255.255.255.0 name=Studio%20Mac id=uuid-A`), {
		address: '192.168.4.184',
	})
	// A different Mac.
	d._onMessage(Buffer.from(`${BEACON_PREFIX} sel=192.168.10.199 mask=255.255.255.0 name=Booth%20Mac id=uuid-B`), {
		address: '192.168.10.199',
	})
	const choices = d.getChoices()
	assert.equal(choices.length, 2) // two Macs, two rows
	assert.deepEqual(
		choices.map((c) => c.label),
		['Booth Mac (192.168.10.199)', 'Studio Mac (192.168.10.46)']
	)
	// The saved value is still the reachable LAN IP, not the name or camera VLAN.
	const studio = choices.find((c) => c.label.startsWith('Studio'))
	assert.equal(studio.id, '192.168.10.46')
})

test('MiddleDiscovery: a legacy bare beacon is keyed by source IP', () => {
	const d = new MiddleDiscovery()
	d._onMessage(Buffer.from(BEACON_PREFIX), { address: '172.16.0.4' })
	assert.deepEqual(
		d.getChoices().map((c) => c.id),
		['172.16.0.4']
	)
})
