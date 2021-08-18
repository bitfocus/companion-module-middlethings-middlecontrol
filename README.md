# companion-module-middlethings-middlecontrol

Official plugin to control Middle Control software using Companion.<br><br>

						If you are running Middle Control on this computer, you can type  127.0.0.1 in the IP adress field. Please note that :

						<ul>
							<li>Middle Control software has to be running (locally on this computer or on any computer on this network) </li>
							<li>Middle Control software has to be connected to your ATEM if you have one</li>
							<li>In order to control gimbal movements you will need to use an APC-R</li>
						</ul>
						<a href="https://www.middlethings.co/product-middle-control/#downloads" target="_new" class="btn btn-primary">Download Middle Control</a>
						<a href="https://middlethings.co/" target="_new" class="btn btn-secondary">Official Website</a>

https://github.com/bitfocus/companion-module-requests/issues

In that way, more people will get to benefit from this in the future, thanks.

**V1.0.0**
A generic module for performing simple TCP and UDP requests, for more info look in HELP.md

**V1.0.1**
-Fixed errors in HELP.md file

**V1.0.2**
-Added the option to chose the end caractors: \r, \n, \r\n, \n\r or none at all.

**V1.0.5**
-Added the option to insert hex codes using the %hh format.

**V1.0.6**
-pre-encode send buffer as 'latin1' (binary) to prevent 'utf8' escape of 8bit characters