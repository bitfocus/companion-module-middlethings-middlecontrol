import { Regex } from '@companion-module/base'


export const ConfigFields = [

			{
				type: 'static-text',
				id: 'info',
				label: 'Information',
				width: 12,
				value:
				'Controls the **Middle Control** software. \n\n' +
				
				'Instructions & ready-to-go Companion pages: [middlethings.co/companion](https://www.middlethings.co/companion)\n\n' +
				'Running Middle Control on the same computer as Companion? Type **127.0.0.1** in the Target IP field below and press Save. ' +
				'Otherwise enter the IP of the computer running Middle Control. \n\n' +
				'- Middle Control must be running (on this computer, or any computer on this network)\n' +
				'- Controlling gimbal movement requires an APC-R / APC-R Mini / APC-R Mini Lite\n \n' +

				'Questions? Contact **support@middlethings.co**',
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
	