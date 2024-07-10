/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/ui/serverWidget'], function(record, serverWidget) {

    function beforeLoad(context) {
        var form = context.form;
        var type = context.type;
        
        // Check if the event type is 'view' or 'edit'
        if (type === context.UserEventType.CREATE || type === context.UserEventType.EDIT) {
            // Replace 'your_field_id' with the actual field ID you want to enable
            var field = form.getField({
                id: 'entityid'
            });
            
            if (field) {
                field.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.NORMAL
                });
            }
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
