/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error'],
    function (search, record, email, runtime, error) {
        function getInputData() {
            var purchaseorderSearchObj = search.create({
                type: "purchaseorder",
                filters:
                    [
                        ["type", "anyof", "PurchOrd"],
                        "AND",
                        ["status", "anyof", "PurchOrd:A"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "mainline", label: "*" }),
                        search.createColumn({ name: "type", label: "Type" }),
                        search.createColumn({ name: "statusref", label: "Status" })
                    ]
            });
                return purchaseorderSearchObj;
        }
        function map(context) {
           var purchaseOrderId = JSON.parse(context.value);
           log.debug('Poid',purchaseOrderId);
           var results=purchaseOrderId.id;
            // Load the purchase order record
            var purchaseOrder = record.load({
                type: record.Type.PURCHASE_ORDER,
                id:results,
                isDynamic:true
            });

            // Enable the "Closed" checkbox for each expense item in the Items subtab
            var itemCount = purchaseOrder.getLineCount({ sublistId: 'item' });
            log.debug('itemscount',itemCount);
            for (var i = 0; i < itemCount; i++) {
               /*purchaseOrder.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'isclosed',
                    line: i
                });*/
                purchaseOrder.selectLine({
                    sublistId: 'item',
                    line:i
                });

                // Enable the "Closed" checkbox for the selected line
                purchaseOrder.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'isclosed',
                    value: true,
                    ignoreFieldChange: true,
                    forceSyncSourcing: true
                });

                purchaseOrder.commitLine({
                    sublistId: 'item'
                });
               
        }
            // Save the changes to the purchase order record
            var purchaseOrderId = 
            purchaseOrder.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });

            // Pass the purchase order ID to the Reduce stage
            context.write(purchaseOrderId);
        }
        function reduce(context) {
            // Perform any necessary aggregations or post-processing with the purchase order ID passed from the Map stage
            var purchaseOrderId = context.values[0];

            // Log or process the result as needed
            log.debug('Purchase Order Closed:', 'Purchase Order ID ' + purchaseOrderId + ' closed successfully.');
        }
        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce
        };
    });
