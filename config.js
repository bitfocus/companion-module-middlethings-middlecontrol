import { Regex } from '@companion-module/base'


export const ConfigFields = [

			{
				type: 'static-text',
				id: 'info',
				label: 'Information',
				width: 12,
				value: `

					Instructions & download ready to go Companion pages at https://www.middlethings.co/companion <br /><br />
					If you are running Middle Control on this same computer, you can type  127.0.0.1 in the IP adress field below and press Save. Please note that :<br /><br />
					
						- Middle Control software has to be running (locally on this computer or on any computer on this network)<br />
						- In order to control gimbal movements you will need to use an APC-R or APC-R Mini<br /><br />
					
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
	