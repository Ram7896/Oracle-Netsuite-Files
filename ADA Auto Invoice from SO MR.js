/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['N/search', 'N/record', 'N/log', 'N/runtime'], (search, record, log, runtime) => {

    function getInputData() {
        const currentScript = runtime.getCurrentScript();

        const savedSearchId = currentScript.getParameter({
            name: "custscript_ada_transaction_so_srch"
        });
        log.debug({ title: 'savedSearchId', details: savedSearchId });

        if (savedSearchId) {
            const loadSavedSearch = search.load({
                id: savedSearchId,
            });
            log.debug({ title: 'loadSavedSearch', details: loadSavedSearch });

            return loadSavedSearch;
        } else {
            log.error({ title: 'Saved search Id not provided in script parameter' });
        }
    }

    function map(context) {
        try {
            // Load each pending billing sales order
            const parseValue = JSON.parse(context.value);
            log.debug({ title: 'parseValue:', details: parseValue });
            const salesOrderId = parseValue.id;
            log.debug({ title: 'SalesOrderId:', details: salesOrderId });
            // Transform sales order to invoice
            const invoiceRecord = record.transform({
                from: {
                    type: record.Type.SALES_ORDER,
                    id: salesOrderId,
                },
                to: record.Type.INVOICE,
                isDynamic: true
            });
            invoiceRecord.setValue({
                fieldId: "approvalstatus",
                value: "2", // Fix typo here
            });

            const invoiceId = invoiceRecord.save();
            log.debug({ title: 'Invoice Id:', details: invoiceId });
            log.debug({
                title: 'Sales Order Transformed to Invoice',
                details: 'Sales Order ID: ' + salesOrderId + ', Invoice ID: ' + invoiceId
            });
        } catch (e) {
            log.error({
                title: 'Error Processing Sales Order',
                details: e
            });
        }
    }

    function reduce(context) {
        // Not used in this example
    }

    function summarize(summary) {
        // Not used in this example
    }

    return {
        getInputData,
        map,
        reduce,
        summarize
    };

});
