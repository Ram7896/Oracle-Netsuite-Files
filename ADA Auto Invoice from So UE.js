/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/log', 'N/runtime'],

function(search, record, log, runtime) {

    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            var searchFilterId = runtime.getCurrentScript().getParameter({
                name: 'custscript_ada_transaction_so_srch_1'
            });
            if (!searchFilterId) {
                log.error({
                    title: 'Search Filter ID not provided',
                    details: 'Please provide a valid search filter ID as a script parameter.'
                });
                return;
            }
            try {
                var searchObj = search.load({
                    id: searchFilterId
                });
                var searchResults = searchObj.run();
                searchResults.each(function(result) {
                    var salesOrderId = result.id;
                    try {
                        var invoiceRecord = record.transform({
                            fromType: record.Type.SALES_ORDER,
                            fromId: salesOrderId,
                            toType: record.Type.INVOICE,
                            isDynamic: true
                        });

                        var invoiceId = invoiceRecord.save();
                        log.debug({
                            title: 'Invoice Created',
                            details: 'Invoice ID: ' + invoiceId + ' for Sales Order ID: ' + salesOrderId
                        });
                       /* record.submitFields({
                            type: record.Type.SALES_ORDER,
                            id: salesOrderId,
                            values: {
                                status: 'Billed'
                            }
                        });*/

                        log.debug({
                            title: 'Sales Order Updated',
                            details: 'Sales Order ID: ' + salesOrderId
                        });
                    } catch (e) {
                        log.error({
                            title: 'Error Processing Sales Order',
                            details: 'Sales Order ID: ' + salesOrderId + ', Error: ' + e.message
                        });
                    }
                    return true;
                });
            } catch (e) {
                log.error({
                    title: 'Error Running Search',
                    details: e.message
                });
            }
        }
    }

    return {
        afterSubmit: afterSubmit
    };

});
