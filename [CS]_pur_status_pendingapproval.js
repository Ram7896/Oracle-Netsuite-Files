/** 
*@NApiVersion 2.x
*@NScriptType ClientScript
*/
define(['N/currentRecord', 'N/search', 'N/record'],
    function (currentRecord, search, record) {
        function pageInit(context) {
            alert('entered');
        }
        function fieldChanged(context) {
            var newRecord = context.currentRecord;
            var customerId = newRecord.getValue({
                fieldId: "custpage_subsidiary"
            });
            alert('customerId:' + customerId);
            if (context.fieldId == "custpage_subsidiary") {
                alert('saved search is created on SO')
                var transactionSearchObj = search.create({
                    type: "purchaseorder",
                    filters:
                        [
                            ["type", "anyof", "PurchOrd"],
                            "AND",
                            ["subsidiary", "anyof", customerId],
                            "AND",
                            ["status", "anyof", "PurchOrd:A"],
                            "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "tranid", label: "Document Number" })
                        ]
                });
                var searchResultCount = transactionSearchObj.runPaged().count;
                alert('search result count:' + searchResultCount);
                var searchresults = transactionSearchObj.run().getRange({
                    start: 0,
                    end: 1000
                });
                alert('Search results:' + searchresults);
                for (var i = 0; i < searchresults.length; i++) {
                    var purchase_order = searchresults[i].getValue('internalid');
                    var docNum = searchresults[i].getValue('tranid');
                    alert('doc_num get successfully' + docNum);
                    var salesOrderId = newRecord.getField({
                        fieldId: 'custpage_purchase_order'
                    });
                    /*salesOrderId.removeSelectOption({
                         value: null
                     });*/
                    salesOrderId.insertSelectOption({
                        value: purchase_order,
                        text: docNum
                    });
                }
            }
            if (context.fieldId == "custpage_purchase_order") {
                alert('set values started');
                var poid = newRecord.getValue({
                    fieldId: 'custpage_purchase_order'
                });
                alert('po id:' + poid);
                var objRecord = record.load({
                    type: record.Type.PURCHASE_ORDER,
                    id: poid,
                    isDynamic: false
                });
                var name=objRecord.getText({
                    fieldId:'entity'
                });
                var docnum=objRecord.getText({
                    fieldId:'tranid'
                });
                var lineCount = objRecord.getLineCount({
                    sublistId: 'item'
                });
    
                // var totalAmount = 0;
                for (var i = 0; i < lineCount; i++) { 
                    var item = objRecord.getSublistText({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    var amount = objRecord.getSublistValue({ 
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: i
                    });
                    alert('amount get successfully'+amount);
                    newRecord.selectNewLine({
                    sublistId: 'custpage_results'
                });
                var number = newRecord.setCurrentSublistValue({
                    sublistId: 'custpage_results',
                    fieldId: 'custpage_document_number',
                    value: docnum
                });
                alert('doc_num set successfully:' + number);
                var name_tr = newRecord.setCurrentSublistValue({
                    sublistId: 'custpage_results',
                    fieldId: 'custpage_name',
                    value: name
                });
                alert('name set successfully:' + name);
                var Amounts = newRecord.setCurrentSublistValue({
                    sublistId: 'custpage_results',
                    fieldId: 'custpage_amount',
                    value: amount
                });
                alert('amount set successfully:' + amount);
                newRecord.commitLine({
                    sublistId: 'custpage_results'
                });
            }
            }
        }
        return {
            fieldChanged: fieldChanged,
            pageInit: pageInit
        };
    }
);