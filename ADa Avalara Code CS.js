/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/ui/message', 'N/ui/dialog'], function (record, message, dialog) {
    function saveRecord(context) {
        var newRecord = context.newRecord;
        var internalId = newRecord.id;
        var Avalaracode = newRecord.getValue({
            fieldId: "custentity_ada_avalara_customer_code"
        });
        var customerSearchObj = search.create({
            type: "customer",
            filters:
                [
                    ["custentity_ada_avalara_customer_code", "startswith", Avalaracode]
                ],
            columns:
                [
                    search.createColumn({ name: "custentity_ada_avalara_customer_code", label: "Avalara Customer Code" })
                ]
        });
        var searchResultCount = customerSearchObj.runPaged().count;
        log.debug("customerSearchObj result count", searchResultCount);
        customerSearchObj.run().each(function (result) {
            var externalId = result.getValue('internalid');
            log.debug("Saved Search ExternalId:", externalId);
            if (externalId) {
                alert("This external Id" + externalId + "already exists");
            }
            else {
                var id = record.submitFields({
                    type: record.Type.CUSTOMER,
                    id: internalId,
                    values: {
                        externalid: Avalaracode
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
                log.debug("externalid set successfully:", id);
            }
        });

    }
    return {
        saveRecord: saveRecord
    };

});
