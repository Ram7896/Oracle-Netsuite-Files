/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], function(record, log) {

    function afterSubmit(context) {
        if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.DELETE) {
            var DateRecord = context.newRecord;//Get record

            // Get the old date value from the previous record state
            var oldDate = DateRecord.getValue({
                fieldId: 'trandate'
            });

            // Check if the old date is not null
            if (oldDate !== null) {
                // Calculate the new date (old date + 3 days)
                var newDate = new Date(oldDate);
                newDate.setDate(newDate.getDate() + 3);

                // Set the new date in the custom field
                record.submitFields({
                    type: context.newRecord.type,
                    id: context.newRecord.id,
                    values: {
                        'custbody1': newDate // Replace with your actual custom field ID
                    }
                });

                log.debug({
                    title: 'Delete Date Updated',
                    details: 'Delete date has been updated to: ' + newDate
                });
            }
        }
    }

    return {
        afterSubmit: afterSubmit
    };

});
