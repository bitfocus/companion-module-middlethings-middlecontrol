import { Regex } from '@companion-module/base'


export const ConfigFields = [

			{
				type: 'static-text',
				id: 'info',
				label: 'Information',
				width: 12,
				value: `

					Controls the Middle Control software (Blackmagic & Sony cameras, and DJI gimbals via APC-R hardware). Instructions & ready-to-go Companion pages at https://www.middlethings.co/companion <br /><br />
					Running Middle Control on the same computer as Companion ? Type <b>127.0.0.1</b> in the Target IP field below and press Save. Otherwise enter the IP of the computer running Middle Control. The module connects over TCP on port <b>11580</b>.<br /><br />

						- Middle Control software has to be running (locally on this computer or on any computer on this network)<br />
						- In order to control gimbal movements you will need to use an APC-R / APC-R Mini or APC-R Mini Lite<br />
						- Streamdeck+ users: see the "Encoders (Streamdeck+)" preset category for ready-made rotary controls (focus, iris, gain, WB, …)<br /><br />

					The connection turns green (OK) once Middle Control is reachable. If it stays yellow (Connecting), check the IP is correct, that Middle Control is running, and that port 11580 isn't blocked by a firewall.<br /><br />

					If you have any questions, please let us know at support@middlethings.co
			`,
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
	