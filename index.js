import { InstanceBase, InstanceStatus, runEntrypoint, TCPHelper } from '@companion-module/base'
import { buildConfigFields } from './config.js'
import { getActionDefinitions } from './actions.js'
import { getVariables, perCameraVariables } from './variables.js'
import { getFeedbackDefinitions } from './feedbacks.js'
import { getPresetDefinitions } from './presets.js'
import { reassembleFrames, sanitizeCommand, parseFrame, isSelectedFrame, toState, toVars, toCamVars } from './lib.js'
import { MiddleDiscovery } from './discovery.js'

const FEEDBACK_IDS = [
	'CurrentCameraID',
	'RecordingStatus',
	'AutofocusStatus',
	'NDStatus',
	'DigitalZoomStatus',
	'CurrentPresetActive',
	'CameraConnectionStatus',
	'APCRConnectionStatus',
	'ShakeRunning',
	'ZoomLoopRunning',
	'PresetsSequenceRunning',
]

class instance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Disconnected)

		// Best-effort LAN auto-discovery (listens for the app's :15502 beacon).
		// Never throws; if it fails, manual IP entry is unaffected.
		if (!this.discovery) {
			this.discovery = new MiddleDiscovery(this.log.bind(this))
			this.discovery.start()
		}

		this.setFeedbackDefinitions(getFeedbackDefinitions(this))
		this.setActionDefinitions(getActionDefinitions(this))
		this.setPresetDefinitions(getPresetDefinitions(this))
		this.setVariableDefinitions(getVariables(this))

		// Seed every variable to '-' so buttons show a placeholder instead of
		// being blank until the first feedback frame arrives.
		this.setVariableValues(Object.fromEntries(getVariables(this).map((v) => [v.variableId, '-'])))

		this.MIDDLE = { CAM: '1' }
		this.camState = {} // per-camera state keyed by camera id (filled when "Track all cameras" is on)
		this.knownCams = new Set()
		this._lastVars = {}
		this._seenPresC = false
		await this.configUpdated(config)
	}

	// When module gets deleted
	async destroy() {
		if (this.socket) {
			this.socket.destroy()
			delete this.socket
		}
		if (this.discovery) {
			this.discovery.stop()
			delete this.discovery
		}
		this.updateStatus(InstanceStatus.Disconnected)
	}

	async configUpdated(config) {
		if (this.socket) {
			this.socket.destroy()
			delete this.socket
		}

		this.config = config

		// The config UI only offers TCP ("Latest"). Older saved configs may still
		// say 'udp' (which never parsed feedback) — migrate them to TCP.
		if (this.config.prot !== 'tcp') {
			this.config.prot = 'tcp'
		}

		this.init_tcp()
	}

	// Return config fields for web config. Built dynamically so the panel can
	// list Middle Control instances discovered on the LAN (refreshed each time
	// the dialog is opened).
	getConfigFields() {
		return buildConfigFields(this.discovery ? this.discovery.getChoices() : [])
	}

	// The IP to connect to: a picked discovered instance wins, otherwise the
	// manually entered Target IP.
	_effectiveHost() {
		const d = this.config?.device
		if (d && d !== 'manual' && /^\d{1,3}(\.\d{1,3}){3}$/.test(d)) return d
		return this.config?.host
	}

	// Clear every published variable and all cached device state, then re-check
	// feedbacks. Used on connection loss so nothing stays stuck on a stale value
	// that is no longer being refreshed.
	_resetAllState() {
		const ids = [
			...getVariables().map((v) => v.variableId),
			...perCameraVariables([...this.knownCams]).map((v) => v.variableId),
		]
		this.setVariableValues(Object.fromEntries(ids.map((id) => [id, '-'])))
		this._lastVars = {}
		this.MIDDLE = {} // undefined fields make every feedback evaluate to "off"
		this.camState = {}
		this._lastFeedbackSig = undefined
		this.checkFeedbacks(...FEEDBACK_IDS)
	}

	init_tcp() {
		if (this.socket) {
			this.socket.destroy()
			delete this.socket
		}

		this.updateStatus(InstanceStatus.Connecting)

		const host = this._effectiveHost()
		if (host) {
			this.socket = new TCPHelper(host, 11580)
			this._rx = '' // TCP frame-reassembly buffer

			this.socket.on('status_change', (status, message) => {
				this.updateStatus(status, message)
				this.log('debug', 'TCP status_change ' + status + ' ' + message)
				if (status === InstanceStatus.Ok) {
					// Fresh link: forget everything learnt on the previous one.
					this._seenPresC = false
					this.camState = {}
					this._lastVars = {}
					this._lastFeedbackSig = undefined
					// "Track all cameras" (Middle Control 4.1+): ask for one frame per connected camera on
					// every tick. Older versions don't know the command and simply ignore it.
					if (this.config?.trackAll) this.send('FEED_ALL1')
				}
			})

			this.socket.on('error', (err) => {
				this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
				this.log('error', 'Network error: ' + err.message)
				// Connection lost: clear ALL variables and cached state and re-run
				// feedbacks, so a stale value that is no longer being refreshed can't
				// stay stuck on screen (e.g. a red recording tally or a green
				// connection indicator lingering after the link drops).
				this._resetAllState()
			})

			this.socket.on('data', (data) => {
				// Reassemble the TCP byte stream into '{...}\n' frames. The app emits one frame per
				// tick (several when "Track all cameras" is on), but TCP may coalesce or split packets,
				// so buffer and split on '\n' — never assume one 'data' event == one frame.
				if ((this._rx || '').length + data.length > 65536) {
					this.log('warn', 'RX buffer overflow; clearing')
					this._rx = ''
					return
				}
				const { frames, rest } = reassembleFrames(this._rx, data.toString('latin1'))
				this._rx = rest
				for (const body of frames) this._applyFrame(body)
			})
		} else {
			this.updateStatus(InstanceStatus.BadConfig)
		}
	}

	// ---- Feed frames → state & variables (the parsing itself lives in lib.js: parseFrame/toState/toVars) ----

	_applyFrame(body) {
		const p = parseFrame(body)
		if (p.PRES_C !== undefined) this._seenPresC = true
		const cam = p.CAM
		const trackAll = !!this.config?.trackAll
		if (cam !== undefined) this.camState[cam] = toState(p)

		const vals = {}
		if (isSelectedFrame(p, trackAll, this._seenPresC)) {
			this.MIDDLE = toState(p)
			Object.assign(vals, toVars(p))
		}
		if (trackAll && cam !== undefined) {
			this._ensureCamVars(cam)
			Object.assign(vals, toCamVars(cam, p))
		}
		this._flushVars(vals)
		this._checkFeedbacksIfChanged()
	}

	// One setVariableValues per frame, carrying only the values that actually changed.
	_flushVars(vals) {
		const changed = {}
		for (const [id, value] of Object.entries(vals)) {
			if (this._lastVars[id] !== value) {
				changed[id] = value
				this._lastVars[id] = value
			}
		}
		if (Object.keys(changed).length > 0) this.setVariableValues(changed)
	}

	// Register the cam<N>_* variables the first time camera N is seen.
	_ensureCamVars(cam) {
		if (this.knownCams.has(cam)) return
		this.knownCams.add(cam)
		this.setVariableDefinitions([...getVariables(), ...perCameraVariables([...this.knownCams])])
	}

	// Re-run feedbacks only when something a feedback can see has changed.
	_checkFeedbacksIfChanged() {
		const m = this.MIDDLE || {}
		const perCam = Object.entries(this.camState).map(([c, st]) => [
			c,
			st.REC,
			st.AF,
			st.DZOOM,
			st.PRESET_ACTIVE,
			st.ND,
			st.SHAKE_RUN,
			st.ZLOOP_RUN,
			st.PRESETSEQ_RUN,
		])
		const sig = JSON.stringify([
			m.CAM,
			m.REC,
			m.AF,
			m.DZOOM,
			m.PRESET_ACTIVE,
			m.ND,
			m.SHAKE_RUN,
			m.ZLOOP_RUN,
			m.PRESETSEQ_RUN,
			m.REC_LIST,
			m.CAM_CON_LIST,
			m.APCR_CON_LIST,
			perCam,
		])
		if (sig === this._lastFeedbackSig) return
		this._lastFeedbackSig = sig
		this.checkFeedbacks(...FEEDBACK_IDS)
	}

	send(cmd) {
		let end = '\n'
		let PresetCamID
		let PresetNumber

		this.log('debug', 'SEND =' + cmd)

		/*
            // Iris +/- Management

            var aI = this.MIDDLE.aI
            let iris_array = [
                1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.5, 2.8, 3.2, 3.5, 4.0, 4.5, 5.0, 5.6, 6.3, 7.1, 8.0, 9.0, 10.0, 11.0, 13.0, 14.0,
                16.0, 18.0, 20.0, 22.0,
            ]
            for (var i = 0; i < iris_array.length - 1; i++) {
                if (aI >= iris_array[i] && aI < iris_array[i + 1]) {
                    aI = iris_array[i]
                    break
                }
            }

            if (cmd == 'IRIS+') {
                aI = iris_array[i + 1]
                cmd = 'aI' + aI
            }

            if (cmd == 'IRIS-') {
                aI = iris_array[i - 1]
                cmd = 'aI' + aI
            }
*/
		// Contrast / Saturation / Black Level (+/-) are sent as RAW relative
		// commands (CONT±/SAT±/BLEV±). Middle Control then applies the exact same
		// step as its own GUI buttons — applyContrast / applySaturation /
		// applyBlacklevel with mode .increment — so Companion matches the GUI
		// instead of computing an absolute value from echoed state here (the old
		// approach used the wrong scale via the app's ×100 absolute path and
		// overshot, e.g. black level running past 100).
		// Note: the app's contrast step is ±0.01 while its GUI button uses ±0.02 —
		// bump the app's "contrast+/-" handler to 0.02 for exact contrast parity.

		// Mid Level +/- Management

		var aMLEV = this.MIDDLE.aMLEV
		if (cmd == 'MLEV+' || cmd == 'MLEV-') {
			if (!Number.isFinite(aMLEV)) {
				this.log('warn', 'Ignoring ' + cmd + ': mid-level is not reported by Middle Control (no value available)')
				return
			}
			cmd = 'aMIDLEV' + (cmd == 'MLEV+' ? aMLEV + 0.005 : aMLEV - 0.005)
		}

		// White Level +/- Management

		var aWLEV = this.MIDDLE.aWLEV
		if (cmd == 'WLEV+' || cmd == 'WLEV-') {
			if (!Number.isFinite(aWLEV)) {
				this.log('warn', 'Ignoring ' + cmd + ': white-level is not reported by Middle Control (no value available)')
				return
			}
			cmd = 'aWHITELEV' + (cmd == 'WLEV+' ? aWLEV + 0.01 : aWLEV - 0.01)
		}

		// Strip frame-breaking control chars so a value resolved from a Companion
		// variable cannot inject a second command or corrupt the frame.
		const safeCmd = sanitizeCommand(cmd)
		if (!safeCmd) {
			this.log('warn', 'Empty command after sanitization, not sending')
			return
		}

		let sendBuf = Buffer.from(safeCmd + end, 'latin1')

		if (this.socket !== undefined && this.socket.isConnected) {
			// this.log('sending ', sendBuf, 'to', this.config.host)
			// TCPHelper.send() returns a promise that rejects on a write error (e.g. the
			// peer resets the connection between the isConnected check and the kernel
			// write). Catch it so an unhandled rejection can't crash the module process.
			this.socket.send(sendBuf).catch((e) => this.log('error', 'TCP send failed: ' + e.message))
			this.log('debug', 'TCP Message sent :' + safeCmd)
		} else {
			this.log('error', 'TCP Socket not connected')
		}
	}
}

runEntrypoint(instance, [])

////old

/*
	init_presets() {
		let presets = []
		this.setPresetDefinitions(presets)
	}

*/
