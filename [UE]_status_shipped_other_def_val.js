/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record'], function (record) {

    function beforeSubmit(context) {
        if (context.type !== context.UserEventType.EDIT) {
            return;
        }

        var currentRecord = context.newRecord;

        // Assuming the field IDs for the status and checkbox fields
        var statusFieldId = 'custbody_status';
        var checkboxFieldId = 'custbody_checkbox'; 

        var currentStatus = currentRecord.getValue({ fieldId: statusFieldId });
        log.debug("CurrentStatus:",currentStatus);
        var isCheckboxChecked = currentRecord.getValue({ fieldId: checkboxFieldId });
        log.debug("Checkbox:",isCheckboxChecked);
        // If in edit mode, set status to "Ready" by default
        if (context.type === context.UserEventType.EDIT) {
            if (!isCheckboxChecked) {
                currentRecord.setValue({
                    fieldId: statusFieldId,
                    value: '1' 
                });
            } else if (isCheckboxChecked && currentStatus === 'C') {
                var status = currentRecord.getValue({ fieldId: 'custbody_status' });
                log.debug("Else Status:",status);
                currentRecord.setValue({
                    fieldId: statusFieldId,
                    value:  status
                });

            }
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };
});