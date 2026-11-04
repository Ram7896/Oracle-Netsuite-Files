/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/log'],
    function (search, record, runtime, log) {
 
        function getInputData(context) {
           
                const currentScript = runtime.getCurrentScript();
                const savedSearchId = currentScript.getParameter({
                    name: "custscript_ada_sales_order_saved_search"
                });
                log.debug("savedSearchId is ",savedSearchId);
                if (!savedSearchId) {
                    log.error({ title: 'Saved search Id not provided in script parameter' });
                    return [];
                }
                const loadSavedSearch = search.load({
                    id: savedSearchId,
                });
                log.debug("loadSavedSearch ",loadSavedSearch);
                return loadSavedSearch;
        }
 
        function map(context) {
            try {
                 const searchResult = JSON.parse(context.value);
                const salesOrderId = searchResult.id;
                log.debug("salesOrderId",salesOrderId);
                const createdBy = searchResult.values['custbody_created_by'].value;
                log.debug("CreatedBy:", createdBy);
 
                const invoiceRecord = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: salesOrderId,
                    toType: record.Type.INVOICE,
                    isDynamic: true
                });
                invoiceRecord.setValue({
                    fieldId: 'custbody_created_by',
                    text: createdBy
                });
                const invoiceId = invoiceRecord.save();
                log.debug("Invoice Id:", invoiceId);
            } catch (error) {
                log.error({
                    title: 'Error in map',
                    details: error
                });
            }
        }
        // function reduce(context) {
        // }
        function summarize(summary) {
            log.debug('Script Complete');
            log.debug('Total Usage Consumed: ' + summary.usage);
            log.debug('Number of Queues: ' + summary.concurrency);
            log.debug('Number of Yields: ' + summary.yields);
        }
 
 
        return {
            getInputData: getInputData,
            map: map,
           // reduce: reduce,
            summarize: summarize
        };
    });
/*important seeting to be emailed checkbox to true but netsuite defaultly uncheck checkbox and generate the pdf in related records
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/*define(['N/search', 'N/record', 'N/log','N/runtime'], function (search, record, log,runtime) {

    function getInputData() {
        var currentScript = runtime.getCurrentScript();

            var savedSeachId = currentScript.getParameter({
                name: "custscript_ada_transaction_so_srch"
            });
            log.debug('savedSeachId', savedSeachId);

            if (savedSeachId) {
                var load_saved_search = search.load({
                    id: savedSeachId,
                });
                log.debug("load_saved_search", load_saved_search);

                return load_saved_search;
            } else {
                log.error("Saved search Id not provided in script parameter");
            }
    }

    function map(context) {
        try {
        // Load each pending billing sales order
        var parsevalue = JSON.parse(context.value);
            log.debug("Parse value:",parsevalue);
        var salesOrderId = parsevalue.id;
        log.debug("SalesOrderId:",salesOrderId);
        const autobilling = parsevalue.values['custbody3'];
                log.debug("autobilling:", autobilling);
                var sup_email_val = autobilling =='T'?true:false;
                log.debug("sup_email_val",sup_email_val);
        // Transform sales order to invoice
        var invoiceId = record.transform({
            fromType: record.Type.SALES_ORDER,
            fromId: salesOrderId,
            toType: record.Type.INVOICE,
            isDynamic: true
        });
        if(!sup_email_val){
           var setemailvalue = invoiceId.setValue({
                fieldId:"tobeemailed",
                value:true,
                ignoreFieldChange: true
            });
            log.debug("setemailvalue:",setemailvalue);
        }
        var InvRecID=invoiceId.save();
        log.debug({
            title: 'Sales Order Transformed to Invoice',
            details: 'Sales Order ID: ' + salesOrderId + ', Invoice ID: ' + InvRecID
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
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };

});*/