/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log'],
    function (record, log) {

        function afterSubmit(context) {
            try {
                log.debug('Script Triggered', 'Script triggered successfully.');
              
                    log.debug('Event Type', 'Event type is UserEventType.CREATE');
                    
                    var newRecord = context.newRecord;
                    // Get the value of the checkbox field
                    var isChecked = newRecord.getValue({
                        fieldId: 'custbody8'
                    });
                    log.debug('Checkbox Value', 'Current value of custbody8: ' + isChecked);
                    
                    // If the checkbox is not already checked
                    if (!isChecked) {
                        // Save the record
                        var recordId = record.submitFields({
                            type: newRecord.type,
                            id: newRecord.id,
                            values: {
                                'custbody8': true
                            },
                            options: {
                                ignoreMandatoryFields: true
                            }
                        });
                        log.debug('Checkbox Enabled:', 'Checkbox custbody8 is now enabled for record with ID ' + recordId);
                }
            } catch (e) {
                log.error('Error:', e);
            }
        }
        return {
           afterSubmit: afterSubmit
        };
    });
