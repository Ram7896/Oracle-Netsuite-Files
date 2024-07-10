/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], function(record, log) {

    function afterSubmit(context) {
        try {
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                var vendorRecord = context.newRecord;//Get record
                var vendorId = context.newRecord.id;// Get the Vendor record
                // Get custom tab fields
                var bankNumber = vendorRecord.getValue({//Getting bank details custom tab
                    fieldId: 'custentity1'
                });
                log.debug('banknumber:',bankNumber);
                var bankaccountNumber = vendorRecord.getValue({
                    fieldId: 'custentity2'
                });
                log.debug('accountNumber:',bankaccountNumber);
                var bankaccountType = vendorRecord.getValue({
                    fieldId: 'custentity3'
                });
                log.debug('accountType:',bankaccountType);
                var Type = vendorRecord.getValue({
                    fieldId: 'custentity5'
                });
                log.debug('Type:',Type);
                var paymentFileFormat = vendorRecord.getValue({
                    fieldId: 'custentity4'
                });
                log.debug('paymentFileFormat:',paymentFileFormat);
                // Create a new entity record
                var newEntityRecord = record.create({//Based on that details set those values new entity bankdetail
                    type: 'customrecord_2663_entity_bank_details',
                    isDynamic:true
                });

                // Set custom tab values to the new entity record
                newEntityRecord.setValue({
                    fieldId: 'custrecord_2663_entity_bank_no',
                    value: bankNumber
                });
                newEntityRecord.setValue({
                    fieldId: 'custrecord_2663_entity_acct_no',
                    value: bankaccountNumber
                });
                newEntityRecord.setValue({
                    fieldId: 'custrecord_2663_parent_vendor',
                    value: vendorId
                });
                
                newEntityRecord.setValue({
                    fieldId: 'custrecord_2663_entity_bank_acct_type',
                    value: accountType
                });
                newEntityRecord.setValue({
                    fieldId: 'custpage_2663_entity_file_format',
                    value: paymentFileFormat
                });
                newEntityRecord.setValue({
                    fieldId: 'custrecord_2663_entity_bank_type',
                    value: Type
                });
                // Save the new entity record
                var entityId = newEntityRecord.save();

                log.debug({
                    title: 'New Entity Record Created',
                    details: 'Entity ID: ' + entityId
                });
            }
        } catch (error) {
            log.error({
                title: 'Error Creating Entity Record',
                details: error.toString()
            });
        }
    }

    return {
        afterSubmit: afterSubmit
    };

});
