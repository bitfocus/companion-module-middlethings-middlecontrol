import { Regex } from '@companion-module/base'


export const ConfigFields = [

			{
				type: 'static-text',
				id: 'info',
				label: 'Information',
				width: 12,
				value: `
				<div class="alert alert-secondary">
					<h3>Middle Control</h3>
					<div>
				
						Official plugin to control MiddleControl software using Companion.<br><br>
						Instructions & download ready to go Companion pages at <a href="https://www.middlethings.co/companion" target="_new">middlethings.co/companion</a><br><br>
						If you are running Middle Control on this same computer, you can type  127.0.0.1 in the IP adress field below and press Save. Please note that :
						<ul>
							<li>Middle Control software has to be running (locally on this computer or on any computer on this network) </li>
							<li>Middle Control software has to be connected to your ATEM if you have one</li>
							<li>In order to control gimbal movements you will need to use an APC-R</li>
						</ul>
						If you have any questions, please let us know at support@middlethings.co
						<br><br>
						<a href="https://www.middlethings.co/product-middle-control/#downloads" target="_new" class="btn btn-primary"> ----> Download Middle Control</a>
                        <br>
						<a href="https://middlethings.co/companion" target="_new" class="btn btn-secondary">---->  Custom Companion pages</a>
					</div>
				</div>
			`,
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 6,
				regex: Regex.IP,
			}
		]
	