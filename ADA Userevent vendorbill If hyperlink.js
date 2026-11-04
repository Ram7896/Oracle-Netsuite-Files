/**
*@NApiVersion 2.1
*@NScriptType UserEventScript
*/
define(['N/record', 'N/runtime', 'N/url', 'N/log', "N/search"],
    function (record, runtime, url, log, search) {
        function beforeLoad(context) {
            try {
                var newRecord = context.newRecord;

                var internalId = newRecord.getValue({
                    fieldId: 'itemrcpt'
                });

                log.debug("Item Receipt:", internalId);
                if (internalId) {
                    var fieldLookUp = search.lookupFields({
                        type: search.Type.ITEM_RECEIPT,
                        id: internalId,
                        columns: ['tranid']
                    });
                    var tranId = fieldLookUp.tranid;
                    log.debug("Tran Id:", tranId);
                    // Generate proper record URL using URL module
                    var recordLink = url.resolveRecord({
                        recordType: 'itemreceipt',
                        recordId: internalId
                    });
                    var link = '<a target="_blank" href="' + recordLink + '" style="color: blue;">' + 'Item Receipt #' + tranId + '</a>';

                    newRecord.setValue({
                        fieldId: 'custbody4',
                        value: link
                    });
                }

            } catch (e) {
                log.error({
                    title: 'Error in beforeLoad',
                    details: e
                });
            }
        }

        return {
            beforeLoad: beforeLoad
        };
    });
