import { Regex } from '@companion-module/base'


export const ConfigFields = [

			{
				type: 'static-text',
				id: 'info',
				label: 'Information',
				width: 12,
				value:
				'### Middle Control\n' +
				'Remote control for **Middle Control** — Blackmagic & Sony cameras, and DJI gimbals (via APC-R hardware).\n\n' +
				'**Setup**\n' +
				'1. Make sure **Middle Control is running** — on this computer, or any computer on this network.\n' +
				'2. In **Target IP** below, enter `127.0.0.1` if it runs on this computer, otherwise that computer\'s IP, then press **Save**.\n' +
				'3. The connection turns **green (OK)** once reachable. Stuck on yellow? Check the IP, that Middle Control is running, and that **TCP port 11580** is open.\n\n' +
				'**Good to know**\n' +
				'- 🎚️ **Gimbal movement** needs an APC-R / APC-R Mini / APC-R Mini Lite.\n' +
				'- 🎛️ **Stream Deck +** — ready-made encoder presets live in the **Encoders (Streamdeck+)** category (focus, iris, gain, WB, …).\n\n' +
				'**Links** — [Setup guide & ready-to-go pages](https://www.middlethings.co/companion) · Questions? **support@middlethings.co**',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 6,
				regex: Regex.IP,
			},
            {
				type: 'dropdown',
				id: 'prot',
				label: 'Middle Control Software Version',
				default: 'tcp',
				choices: [
					{ id: 'tcp', label: 'Latest' },
				],
			},
		]
	