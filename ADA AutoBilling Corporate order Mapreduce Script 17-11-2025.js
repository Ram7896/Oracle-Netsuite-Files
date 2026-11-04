/*************************************************************************************************************************************
* Script fieldId            :   ADA Auto Billing Sales Order to Invoice
* Author                    :   Vaibhavi Manchala
* Creation date             :   16nd May 2024
* Company                   :   Capgemini India
* Description               :   This script is used to transform Sales Order record to Invoice Record.
* Change Log                :   ||    Changed By         ||    Date        ||            Description                                ||
                                    Vaibhavi Manchala    ||   03-06-2024   || added supress email   
                                    Vaibhavi Manchala    ||   28-08-2024   || added approval status to invoice record                 
*************************************************************************************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/log'],
    function (search, record, runtime, log) {

        function getInputData() {
            const currentScript = runtime.getCurrentScript();
            const savedSearchId = currentScript.getParameter({
                name: "custscript_ada_sales_order_saved_search"
            });

            log.debug("Saved Search ID", savedSearchId);

            if (!savedSearchId) {
                log.error({ title: 'Saved search Id not provided in script parameter' });
                return [];
            }

            const loadSavedSearch = search.load({
                id: savedSearchId,
            });

            const searchCount = loadSavedSearch.runPaged().count;
            log.debug("Number of search results", searchCount);

            // log.debug("Loaded Saved Search", loadSavedSearch);
            return loadSavedSearch;
        }

        function map(context) {
            try {
                const searchResult = JSON.parse(context.value);
                const salesOrderId = searchResult.id;

                context.write({
                    key: salesOrderId,
                    value: searchResult
                });

            } catch (error) {
                log.error({
                    title: 'Error in map function',
                    details: error
                });
            }
        }

        function reduce(context) {
            try {
                const soDetails = context.values;
                const salesOrderId = context.key;
                log.debug("Sales Order ID", salesOrderId);
                log.debug("Sales Order Details", soDetails);
                log.debug("Sales Order Details length", soDetails.length);
                var invoiceDetailsArray = [];

                for (var soItemCount = 0; soItemCount < soDetails.length; soItemCount++) {
                    var soDetailsData = JSON.parse(soDetails[soItemCount]);
                    var createdBy = soDetailsData.values['custbody_created_by'].value;
                    var supress_email = soDetailsData.values['custbody_ada_suppress_invoice_email'];
                    var soItem = soDetailsData.values['item'].value;
                    var soItemType = soDetailsData.values['type.item'].value;
                    var soMemberItem = soDetailsData.values['memberitem.item'].value;
                    log.debug("Created By", createdBy);
                    log.debug("Suppress Email", supress_email);
                    log.debug("SO Item", soItem);
                    log.debug("SO Item Type", soItemType);
                    log.debug("SO Member Item", soMemberItem);
                    var invoiceDetails = {
                        createdBy: createdBy,
                        supress_email: supress_email,
                        item: soItem,
                        itemType: soItemType,
                        memberItem: soMemberItem
                    }
                    log.debug("Invoice Details JSON in Map", invoiceDetails);
                    invoiceDetailsArray.push(invoiceDetails);
                }

                log.debug("Invoice Deatails Array", invoiceDetailsArray);

                const invoiceRecord = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: salesOrderId,
                    toType: record.Type.INVOICE,
                    isDynamic: true
                });

                invoiceRecord.setValue({
                    fieldId: 'custbody_created_by',
                    value: invoiceDetailsArray[0].createdBy
                });

                invoiceRecord.setValue({
                    fieldId: 'approvalstatus',
                    value: 2
                });
                log.debug("status is set to Approved");

                if (invoiceDetailsArray[0].supress_email === 'T') {
                    invoiceRecord.setValue({
                        fieldId: 'tobeemailed',
                        value: false,
                        ignoreFieldChange: true
                    });
                } else {
                    invoiceRecord.setValue({
                        fieldId: 'tobeemailed',
                        value: true,
                        ignoreFieldChange: true
                    });
                }
                var invoiceLineCount = invoiceRecord.getLineCount({ sublistId: 'item' });
                for (var invLine = 0; invLine < invoiceLineCount; invLine++) {
                    var itemName = invoiceRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: invLine
                    });
                    log.debug("Item Name on Invoice Record", itemName);
                    var invItemType = invoiceRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemtype',
                        line: invLine
                    });
                    log.debug("Item Type on Invoice Record", invItemType);
                    var invItemAmount = invoiceRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: invLine
                    });
                    log.debug("Item Amount on Invoice Record", invItemAmount);
                    var invItemLineNo = invLine + 1;

                    if (invItemType === 'Kit') {

                        var foundItem = invoiceDetailsArray.filter(soItem => soItem.item === itemName);

                        if (foundItem && foundItem.length > 0) {

                            invoiceRecord.selectLine({
                                sublistId: 'item',
                                line: invLine
                            });

                            invoiceRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                value: 0
                            });

                            invoiceRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ada_kit_amount',
                                value: invItemAmount
                            });

                            invoiceRecord.commitLine({
                                sublistId: 'item'
                            });

                            var newKitItemAmount = (invItemAmount / foundItem.length).toFixed(2);
                            var remainingKitAmount = invItemAmount;

                            for (var kitLine = 0; kitLine < foundItem.length; kitLine++) {

                                invoiceRecord.insertLine({
                                    sublistId: 'item',
                                    line: invItemLineNo++,
                                    ignoreRecalc: true
                                });

                                invoiceRecord.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    value: foundItem[kitLine].memberItem
                                });

                                invoiceRecord.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    value: 0
                                });

                                if (kitLine === foundItem.length - 1) {
                                    invoiceRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'amount',
                                        value: remainingKitAmount
                                    });
                                } else {
                                    invoiceRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'amount',
                                        value: newKitItemAmount
                                    });

                                    remainingKitAmount -= newKitItemAmount;
                                }

                                invoiceRecord.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ada_hide_on_pdf',
                                    value: true
                                });

                                invoiceRecord.commitLine({
                                    sublistId: 'item'
                                });
                            }

                            // Refresh line count
                            invoiceLineCount = invoiceRecord.getLineCount({ sublistId: 'item' });
                        }
                    }
                }
                //invoiceLineCount = invoiceRecord.getLineCount({ sublistId: 'item' });
                //log.debug("Final Invoice Line Count", invoiceLineCount);
                const invoiceId = invoiceRecord.save();
                log.debug("Invoice ID", invoiceId);





            }
            catch (error) {
                log.error({
                    title: 'Error in reduce function',
                    details: error
                });
            }
        }

        function summarize(summary) {
            log.audit('Summary', {
                totalUsage: summary.usage,
                concurrency: summary.concurrency,
                yields: summary.yields
            });

            summary.mapSummary.errors.iterator().each(function (key, error) {
                log.error({
                    title: `Error for key: ${key}`,
                    details: error
                });
                return true;
            });
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });