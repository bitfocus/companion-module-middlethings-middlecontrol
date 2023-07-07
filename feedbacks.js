import { combineRgb } from '@companion-module/base'

export function getFeedbackDefinitions(self) {
    //var CAMCHECK=parseInt(this.CAM)
    //this.log('debug',"CAM CALLBACK =" + CAMCHECK )

    return {
        
    CurrentCameraID: {
        type: 'boolean', // Feedbacks can either a simple boolean, or can be an 'advanced' style change (until recently, all feedbacks were 'advanced')
        name: 'Camera Selected',
        description: 'If this Camera number is currently selected in Middle Control, change the Companion button style',
        defaultStyle: {
            // The default style change for a boolean feedback
            // The user will be able to customise these values as well as the fields that will be changed
            color: combineRgb(0, 0, 0),
            bgcolor: combineRgb(8, 170, 250),
        },
        // options is how the user can choose the condition the feedback activates for
        options: [
            {
                type: 'number',
                label: 'Camera ID',
                id: 'camera_id',
                default: 1,
            },
        ],
        callback: function (feedback) {
            // This callback will bse called whenever companion wants to check if this feedback is 'active' and should affect the button style
            const value = unescape( feedback.options.camera_id )
            if (self.MIDDLE.CAM == value) {
                return true
            } else {
                return false
            }
        },
    }
        
    }
    
}
