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
            var record = context.currentRecord; // create a new record
            var customerId = record.getValue({ //  to get the value
                fieldId: "inpt_custpage_customer"
            });
            var salesOrderId = record.getField({ // get salerOrder value
                fieldId: 'custpage_sales_order' // get salesOrder id
            });
            alert('customerId' + customerId);
            if (context.fieldId == "inpt_custpage_customer") {
                alert('entered into if');
                if (!customerId) {
                    return;
                }
                alert('saved search is created on SO')
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["mainline", "is", "T"],
                            "AND",
                            ["name", "anyof", customerId]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "tranid", label: "Document Number" })
                        ]
                });
                var searchResultCount = salesorderSearchObj.run().getRange({
                    start: 0,
                    end: 500
                });
                // salesOrderId.removeSelectOption({
                //     value: null
                // });
                for (var i = 0; i < searchResultCount.length; i++) {
                    var sales_order = searchResultCount[i].getValue('internalid');
                    var docNum = searchResultCount[i].getValue('tranid');
                    salesOrderId.insertSelectOption({
                        value: sales_order,
                        text: docNum,
                    });
                    
                }
                
            }   
        }
        function showInformation() {
            alert('entered');
            var newRecord = currentRecord.get(); // create a record
            var salesOrderId = newRecord.getValue({ // get salerOrder value
                fieldId: 'custpage_sales_order' // get salesOrder id
            });
            alert('salesOrderId' + salesOrderId);
            var customerRecord = record.load({
                type: record.Type.SALES_ORDER,
                id: salesOrderId,
                isDynamic: true

            });
            alert('record.loaded');
            var lineCount = customerRecord.getLineCount({ // linecount for the items in line level
                sublistId: 'item'
            });

            // var totalAmount = 0;
            for (var i = 0; i < lineCount; i++) { // using for loop to calculate total amount for linelevel items
                var item = customerRecord.getSublistText({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                // var item_2 =  customerRecord.getSublistText({
                //     sublistId: 'item',
                //     fieldId: 'item',
                //     line: i
                // });
                var amount = customerRecord.getSublistValue({ // amount of linelevel items
                    sublistId: 'item',
                    fieldId: 'amount',
                    line: i,
                });
                alert('entered into linelevel amount field');
                var quantity = customerRecord.getSublistValue({ // quantity of linelevel items
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                }); 
                alert('entered into linelevel quantity field');
                var rate = customerRecord.getSublistValue({ // rate of linelevel items
                    sublistId: 'item',
                    fieldId: 'rate',
                    line: i
                });
                newRecord.selectNewLine({
                    sublistId: 'custpage_items'
                });
                newRecord.setCurrentSublistValue({ // set sublist value for item
                    sublistId: 'custpage_items',
                    fieldId: 'custpage_item',
                    value: item
                });
                newRecord.setCurrentSublistValue({ // set sublist value for quantity
                    sublistId: 'custpage_items',
                    fieldId: 'custpage_quantity',
                    value: quantity
                });
                newRecord.setCurrentSublistValue({ // set sublist value to rate
                    sublistId: 'custpage_items',
                    fieldId: 'custpage_rate',
                    value: rate
                });
                newRecord.setCurrentSublistValue({ // set sublist value for amount
                    sublistId: 'custpage_items',
                    fieldId: 'custpage_amountline',
                    value: amount
                });
                newRecord.commitLine({ // commit the line in sublist
                    sublistId: 'custpage_items'
                });

            }
        }
        function markAll() {
            alert('entered');
            var objRecord = currentRecord.get();
            var lineCount = objRecord.getLineCount({ // linecount for the items in line level
                sublistId: 'custpage_items'
            });
            alert('lineCount' + lineCount);
            for (var i = 0; i < lineCount; i++) {
                alert('lineCount[i]' + i);
                objRecord.selectLine({ // selectLine is used for selecting line
                    sublistId: 'custpage_items',
                    line: i
                });
                objRecord.setCurrentSublistValue({ // set sublist value
                    sublistId: 'custpage_items',
                    fieldId: 'custpage_checkbox',
                    value: true
                });
                objRecord.commitLine({ // commit the line in sublist
                    sublistId: 'custpage_items'
                });
            }
        }
        function unmarkAll() {
            alert('entered');
            var objRecord = currentRecord.get();
            var lineCount = objRecord.getLineCount({ // linecount for the items in line level
                sublistId: 'custpage_items'
            });
            alert('lineCount' + lineCount);
            for (var i = 0; i < lineCount; i++) {
                alert('lineCount[i]' + i);
                objRecord.selectLine({ // selectline is used to select the line
                    sublistId: 'custpage_items',
                    line: i
                });
                objRecord.setCurrentSublistValue({ // set the sublist value
                    sublistId: 'custpage_items',
                    fieldId: 'custpage_checkbox',
                    value: false
                });
                objRecord.commitLine({ // commit the line in sublist
                    sublistId: 'custpage_items'
                });
            }
        }
        return {
            fieldChanged: fieldChanged,
            pageInit: pageInit,
            showInformation: showInformation,
            markAll: markAll,
            unmarkAll: unmarkAll 
        };
    }
);


