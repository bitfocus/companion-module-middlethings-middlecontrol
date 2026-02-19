const variables = [
	{
		name: 'Selected Camera Number',
		variableId: 'CAM_var',
	},
	{
		name: 'Pan/Tilt Speed',
		variableId: 'PTS_var',
	},
	{
		name: 'Zoom Speed',
		variableId: 'ZS_var',
	},
	{
		name: 'Slider Speed',
		variableId: 'SS_var',
	},
	{
		name: 'Preset Transition Speed',
		variableId: 'PRES_D_var',
	},
	{
		name: 'Preset Completion (%) ',
		variableId: 'PRES_C_var',
	},
	{
		name: 'White Balance',
		variableId: 'aWB_var',
	},
	{
		name: 'Tint',
		variableId: 'aTINT_var',
	},
	{
		name: 'Gain (dB)',
		variableId: 'aISO_var',
	},
	{
		name: 'Iris',
		variableId: 'aI_var',
	},
	{
		name: 'Shutter',
		variableId: 'aSHUT_var',
	},
	{
		name: 'Contrast',
		variableId: 'aCONT_var',
	},
	{
		name: 'Saturation',
		variableId: 'aSAT_var',
	},
	{
		name: 'Black Level (Luma)',
		variableId: 'aBLACKLEV_var',
	},
	{
		name: 'Mid Level (Luma)',
		variableId: 'aMIDLEV_var',
	},
	{
		name: 'White Level (Luma)',
		variableId: 'aWHITELEV_var',
	},
	{
		name: 'Focus Value',
		variableId: 'aF_var',
	},
	{
		name: 'Gimbal Absolute Pan Value',
		variableId: 'aPAN_var',
	},
	{
		name: 'Gimbal Absolute Tilt Value',
		variableId: 'aTILT_var',
	},
	{
		name: 'Gimbal Absolute Roll Value',
		variableId: 'aROLL_var',
	},
	{
		name: 'Gimbal Motor Zoom Value',
		variableId: 'aZOOM_var',
	},
	{
		name: 'Slider Value',
		variableId: 'aSLIDER_var',
	},
	{
		name: 'Recording Status (0/1)',
		variableId: 'REC_var',
	},
	{
		name: 'AutoFocus Status (0/1)',
		variableId: 'AF_var',
	},
	{
		name: 'Digital Zoom Status (0/1)',
		variableId: 'DZOOM_var',
	},
	{
		name: 'ID of Currently Running Preset  (0 = none active)',
		variableId: 'PRESET_ACTIVE_var',
	},
	{
		name: 'Currently Connected IP Camera List(CAM IDs)',
		variableId: 'LIST_CAM_CON_var',
	},
	{
		name: 'Currently Recording Camera List (CAM IDs) ',
		variableId: 'LIST_REC_var',
	},
	{
		name: 'Currently Connected APC-R List (CAM IDs)',
		variableId: 'LIST_APCR_CON_var',
	},
]

export function getVariables() {
	return variables
}
