/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/log', 'N/search', 'N/format'],
    function (record, log, search, format) {

        function execute(context) {
            try {
                // Define the search filter for Bill Payments created 3 days ago
                //var d = new Date("12/15/2023");
                //var today = new Date("12/15/2023");
                //log.debug('Date:', today);
                //var AfterthreeDays = new Date(today.setDate(today.getDate() + 3));
                //log.debug('Afterthreedays:', AfterthreeDays);
                var billPaymentSearch = search.create({
                    type: "vendorpayment",
                    filters:
                        [
                            ["type", "anyof", "VendPymt"],
                            "AND",
                            ["custbody1", "isnotempty", ""],
                            "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns: ['internalid','custbody1']
                });
                var searchResults = billPaymentSearch.run().getRange({ start: 0, end: 1000 });
                log.debug('searchresults:', searchResults);
                // Loop through the search results and inactivate associated records
                for (var i = 0; i < searchResults.length; i++) {
                    var billPaymentId = searchResults[i].getValue({ name: 'internalid' });
                    log.debug('billpaymentid:', billPaymentId);
                    // Get the Vendor ID associated with the Bill Payment
                    var vendorId = record.load({
                        type: 'vendorpayment',
                        id: billPaymentId
                    }).getValue({
                        fieldId: 'entity'
                    });
                    log.debug('Vednor Id:', vendorId);
                    // Check if the Vendor has the category "One Time Payee"
                    var vendorCategory = record.load({
                        type: 'vendor',
                        id: vendorId
                    }).getText({
                        fieldId: 'category'
                    });
                    log.debug('vendor Category:', vendorCategory);
                    if (vendorCategory === 'One Time Payee') {
                        // Inactivate Vendor record
                        record.submitFields({
                            type: 'vendor',
                            id: vendorId,
                            values: {
                                'isinactive': true
                            }
                        });
                    }
                }
                //Search the Bank entity detail 
                var customrecord_2663_entity_bank_detailsSearchObj = search.create({
                    type: "customrecord_2663_entity_bank_details",
                    filters:
                        [
                            ["custrecord_2663_parent_vendor", "anyof", "1122"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_2663_parent_vendor", label: "Parent Vendor" }),
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                });
                // var searchResultCount = customrecord_2663_entity_bank_detailsSearchObj.runPaged().count;
                //log.debug('searchResultCount:',searchResultCount);
                var searchResults = customrecord_2663_entity_bank_detailsSearchObj.run().getRange({
                    start: 0,
                    end: 1000
                });
                log.debug('Search results:', searchResults);
                for (var i = 0; i < searchResults.length; i++) {
                    var internalid = searchResults[i].getValue('internalid');
                    log.debug('internalid', internalid);
                    record.delete({//Delete the bank entity detail record
                        type: 'customrecord_2663_entity_bank_details',
                        id: internalid
                    })
                    log.debug('record deleted');
                }
                log.debug({
                    title: 'Script Completed',
                    details: 'Records inactivated successfully.'
                });

            } catch (error) {
                log.error({
                    title: 'Error',
                    details: error
                });
            }
        }

        return {
            execute: execute
        };

    });
