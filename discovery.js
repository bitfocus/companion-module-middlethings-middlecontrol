// discovery.js — auto-detect Middle Control instances on the LAN.
//
// Every running Middle Control instance UDP-broadcasts a beacon on port 15502
// every 8 seconds:
//
//     "middleInstance sel=<ip> mask=<netmask>"
//
// `sel=` is the IP of the network the instance actually OPERATES on (the right
// address to connect Companion to); older builds send a bare "middleInstance"
// with no fields, in which case we fall back to the datagram's source address.
//
// This beacon is emitted from the macOS app's applicationDidFinishLaunching —
// it is NOT gated behind the Pro licence, so discovery works for every user
// (Free and Pro) with no app-side changes. It is also the same primitive the
// app itself uses to detect sibling instances (see checkInstanceMiddle.swift /
// InstanceBeacon.swift in the Middle Control macOS source).
//
// This module is best-effort: any socket failure is logged and swallowed so the
// (manual-IP) TCP control path is never affected.

import dgram from 'node:dgram'

export const BEACON_PORT = 15502
export const BEACON_PREFIX = 'middleInstance'
// Drop an instance we haven't heard from in ~3 missed beacons (8 s cadence).
export const STALE_MS = 25000

// Pure parser for a beacon payload. Returns { selIp, mask, fields } for a valid
// beacon, or null when the text is not a beacon at all. `selIp`/`mask` are only
// surfaced when they are dotted-quad IPv4 (mirrors InstanceBeacon.decode).
export function parseBeacon(text) {
	const trimmed = String(text ?? '').trim()
	if (!trimmed.startsWith(BEACON_PREFIX)) return null
	const fields = {}
	for (const tok of trimmed.split(/[\s\t\n]+/).slice(1)) {
		const eq = tok.indexOf('=')
		if (eq <= 0) continue
		const k = tok.slice(0, eq)
		const v = tok.slice(eq + 1)
		if (k && v) fields[k] = v
	}
	const decode = (v) => {
		if (v == null) return undefined
		try {
			return decodeURIComponent(v)
		} catch {
			return v // tolerate a malformed %-sequence rather than dropping the field
		}
	}
	return {
		selIp: isIPv4(fields.sel) ? fields.sel : undefined,
		mask: isIPv4(fields.mask) ? fields.mask : undefined,
		name: decode(fields.name),
		id: decode(fields.id),
		fields,
	}
}

export function isIPv4(s) {
	if (typeof s !== 'string') return false
	const parts = s.split('.')
	if (parts.length !== 4) return false
	return parts.every((o) => /^\d{1,3}$/.test(o) && Number(o) <= 255)
}

export class MiddleDiscovery {
	// log: optional (level, message) => void  (e.g. self.log.bind(self))
	constructor(log) {
		this._log = typeof log === 'function' ? log : () => {}
		this._socket = null
		this._seen = new Map() // ip -> { ip, selIp, source, lastSeen }
	}

	start() {
		if (this._socket) return
		let sock
		try {
			// reuseAddr so we can co-exist with the app when Companion runs on the
			// same Mac (the app binds 15502 too, with port reuse enabled).
			sock = dgram.createSocket({ type: 'udp4', reuseAddr: true })
		} catch (e) {
			this._log('debug', 'Discovery: createSocket failed: ' + e.message)
			return
		}
		this._socket = sock

		sock.on('error', (err) => {
			this._log('debug', 'Discovery: socket error: ' + err.message)
			try {
				sock.close()
			} catch {
				/* already closed */
			}
			if (this._socket === sock) this._socket = null
		})

		sock.on('message', (msg, rinfo) => this._onMessage(msg, rinfo))

		try {
			sock.bind(BEACON_PORT, () => {
				try {
					sock.setBroadcast(true)
				} catch {
					/* not fatal for receiving */
				}
				this._log('debug', 'Discovery: listening for Middle Control beacons on udp/' + BEACON_PORT)
			})
		} catch (e) {
			this._log('debug', 'Discovery: bind failed: ' + e.message)
			this._socket = null
		}
	}

	stop() {
		if (this._socket) {
			try {
				this._socket.close()
			} catch {
				/* already closed */
			}
			this._socket = null
		}
		this._seen.clear()
	}

	_onMessage(msg, rinfo) {
		const beacon = parseBeacon(msg.toString('utf8'))
		if (!beacon) return
		const source = rinfo.address // the address this beacon reached us from (always routable)
		if (!isIPv4(source)) return

		// ONE row per instance. Identity, most stable first: the beacon's `id=`
		// (a stable per-install UUID), else `sel=` (the selected/operating IP,
		// identical across all of a multi-homed Mac's interfaces), else the source
		// address (legacy beacons carrying neither). This collapses all of a Mac's
		// interfaces — and all the subnets Companion hears it on — into one entry.
		const key = beacon.id ?? beacon.selIp ?? source
		let entry = this._seen.get(key)
		if (!entry) {
			entry = { key, sel: beacon.selIp, name: beacon.name, sources: new Set(), lastSeen: 0 }
			this._seen.set(key, entry)
			this._log('info', 'Discovered Middle Control: ' + (beacon.name || key))
		}
		if (beacon.name) entry.name = beacon.name // a later beacon may carry it
		if (beacon.selIp) entry.sel = beacon.selIp
		entry.sources.add(source)
		entry.lastSeen = Date.now()
	}

	// Live list of instances heard within STALE_MS (prunes stale entries).
	list() {
		const now = Date.now()
		const out = []
		for (const [key, entry] of this._seen) {
			if (now - entry.lastSeen > STALE_MS) {
				this._seen.delete(key)
				continue
			}
			out.push(entry)
		}
		return out
	}

	// One reachable IP per instance for the config dropdown. All received sources
	// are routable (a broadcast only arrives from our own subnet), so we prefer
	// the interface that is NOT the camera VLAN (`sel`) — that's the normal LAN
	// address the user recognises — and fall back to the only source we heard.
	// The camera-VLAN `sel` itself is never used as the connect target unless it
	// is literally the only way we reached the instance.
	getChoices() {
		return this.list()
			.map((entry) => {
				const sources = [...entry.sources]
				// Choose the address to connect on. `sel` is the network Middle
				// Control selected as its own — the canonical address — so prefer it
				// WHEN we actually received a beacon from it (that proves it's on our
				// subnet and routable). If we never heard sel directly (e.g. it's a
				// camera VLAN Companion isn't on), fall back to a source we did hear,
				// which is reachable by construction (a broadcast only reaches its subnet).
				const ip = entry.sel && sources.includes(entry.sel) ? entry.sel : sources[0]
				// Label by the instance name when the app advertises one (app ≥ the
				// beacon-name build); older apps have no name, so fall back to the IP.
				return { id: ip, label: entry.name ? `${entry.name} (${ip})` : ip }
			})
			.filter((c) => isIPv4(c.id))
			.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }))
	}
}
