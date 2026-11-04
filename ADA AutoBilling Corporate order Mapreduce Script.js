/*************************************************************************************************************************************
* Script fieldId            :   ADA Auto Billing Sales Order to Invoice
* Author                    :   Vaibhavi Manchala
* Creation date             :   16nd May 2024
* Company                   :   Capgemini India
* Description               :   This script is used to transform Sales Order record to Invoice Record.
* Change Log                :   ||    Changed By         ||    Date        ||            Description                                ||
                                    Vaibhavi Manchala    ||   03-06-2024   || added supress email                    
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
                const createdBy = searchResult.values['custbody_created_by'].value;
                const supress_email = searchResult.values['custbody_ada_suppress_invoice_email'];

                log.debug("Sales Order ID", salesOrderId);
                log.debug("Created By", createdBy);
                log.debug("Suppress Email", supress_email);

                const invoiceRecord = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: salesOrderId,
                    toType: record.Type.INVOICE,
                    isDynamic: true
                });

                invoiceRecord.setValue({
                    fieldId: 'custbody_created_by',
                    value: createdBy
                });

                if (supress_email === 'T') {
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
                const invoiceId = invoiceRecord.save();
                log.debug("Invoice ID", invoiceId);

            } catch (error) {
                log.error({
                    title: 'Error in map function',
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
            summarize: summarize
        };
    });
