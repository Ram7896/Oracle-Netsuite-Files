/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/record', 'N/log'], function (search, record, log) {

    function afterSubmit(context) {
        try {
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                var vendorId = context.newRecord.id;//Geting the internalid of vendor
                log.debug('internalid', vendorId);
                //var companyName = newRecord.getValue({ fieldId: 'entityid' });
                //log.debug('vendorId:',companyName);
                // If vendor record found, retrieve bank details
                var vendorRecord = record.load({//Based on vendor load the record
                    type: 'vendor',
                    id: vendorId,
                    isDynamic: true
                });
                //Based on vendor id search for that parent vendor in bankpayment
                var customrecord_2663_entity_bank_detailsSearchObj = search.create({
                    type: "customrecord_2663_entity_bank_details",
                    filters:
                        [
                            ["custrecord_2663_parent_vendor", "anyof", vendorId]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                });
                var searchResultCount = customrecord_2663_entity_bank_detailsSearchObj.runPaged().count;
                log.debug("customrecord_2663_entity_bank_detailsSearchObj result count", searchResultCount);
                customrecord_2663_entity_bank_detailsSearchObj.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    vendorid = result.getValue({ name: "internalid", label: "Internal ID" });//get that vendorid
                    return true;
                });
                if (searchResultCount == 0) {
                    return;
                }
                var bankDetailsRecord = record.load({//Based on internalid i will load the bankdetails get and set values
                    type: 'customrecord_2663_entity_bank_details',
                    id: vendorid,
                    isDynamic: true
                });
                log.debug('company:', vendorRecord);
                var bankNumber = bankDetailsRecord.getValue({ fieldId: 'custrecord_2663_entity_bank_no' });
                log.debug('banknumber:', bankNumber);
                var bankAccountNumber = bankDetailsRecord.getValue({ fieldId: 'custrecord_2663_entity_acct_no' });
                log.debug('bankAccountnumber:', bankAccountNumber);
                var bankAccountType = bankDetailsRecord.getValue({ fieldId: 'custrecord_2663_entity_bank_type' });
                log.debug('bankAccounttype:', bankAccountType);
                var Paymentfileformat = bankDetailsRecord.getValue({ fieldId: 'custpage_2663_entity_file_format' });
                log.debug('Paymentfileformat:', Paymentfileformat);
                var bankaccounttype = bankDetailsRecord.getValue({ fieldId: 'custrecord_2663_entity_bank_acct_type' });
                log.debug('banknumber:', bankNumber);
                // Update values in the current vendor record
                vendorRecord.setValue({
                    fieldId: 'custentity1',
                    value: bankNumber
                });
                vendorRecord.setValue({
                    fieldId: 'custentity2r',
                    value: bankAccountNumber
                });

                vendorRecord.setValue({
                    fieldId: 'custentity3',
                    value: bankAccountType
                });
                vendorRecord.setValue({
                    fieldId: 'custentity4',
                    value: Paymentfileformat
                });
                vendorRecord.setValue({
                    fieldId: 'custentity5',
                    value: bankaccounttype
                });
                var recordId = vendorRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
            }
        } catch (e) {
            log.error({
                title: 'Error in User Event Script',
                details: e
            });
            throw e; // Rethrow the error to prevent saving the record if an error occurs
        }
    }
    return {
        afterSubmit: afterSubmit
    };
});
