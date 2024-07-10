/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/record', 'N/currentRecord', 'N/search'], function(record, currentRecord, search) {
    function fieldChanged(context) {
        if (context.fieldId === 'custpage_vendor') {
            var vendorId = context.currentRecord.getValue('custpage_vendor');
            if (vendorId) {
                try {
                    // Load the vendor record to get the subsidiary
                    var vendorRecord = record.load({
                        type: record.Type.VENDOR,
                        id: vendorId
                    });

                    var subsidiaryId = vendorRecord.getValue('subsidiary');

                    // Set the subsidiary field value
                    context.currentRecord.setValue('custpage_subsidiary', subsidiaryId);
                } catch (e) {
                    console.error('Error loading vendor record:', e);
                }
            }
        }
    }

    function showInformation() {
        alert('entered');
        var newRecord = currentRecord.get();
        var poid = newRecord.getValue({
            fieldId: 'custpage_vendor'
        });
        alert('purchaseOrderId ' + poid);

        var fromdate = newRecord.getValue({
            fieldId: 'custpage_fromdate'
        });
        var format_fromdate = getFormattedDate(fromdate);
        alert("format_fromdate: " + format_fromdate);

        var todate = newRecord.getValue({
            fieldId: 'custpage_todate'
        });
        var format_todate = getFormattedDate(todate);
        alert("format_todate: " + format_todate);

        var purchaseorderSearchObj = search.create({
            type: "purchaseorder",
            filters: [
                ["type", "anyof", "PurchOrd"],
                "AND",
                ["name", "anyof", poid],
                "AND",
                ["trandate", "within", format_fromdate, format_todate],
                "AND",
                ["mainline", "is", "T"]
            ],
            columns: [
                search.createColumn({ name: "tranid", label: "Document Number" }),
                search.createColumn({ name: "item", label: "Item" }),
                search.createColumn({ name: "amount", label: "Amount" }),
                search.createColumn({ name: "statusref", label: "Status" })
            ]
        });

        var searchResultCount = purchaseorderSearchObj.run().getRange({
            start: 0,
            end: 100
        });

        alert("purchaseorderSearchObj result count: " + searchResultCount.length);

        for (var i = 0; i < searchResultCount.length; i++) {
            var result = searchResultCount[i];
            var doc_number = result.getValue({ name: "tranid" });
            alert("tranid: " + doc_number);
            var item = result.getText({ name: "item" });
            alert("item: " + item);
            var amount = result.getValue({ name: "amount" });
            alert("amount: " + amount);
            var status = result.getValue({ name: "statusref" });
            alert("status: " + status);

            newRecord.selectNewLine({ sublistId: 'custpage_sublist' });
            newRecord.setCurrentSublistValue({
                sublistId: 'custpage_sublist',
                fieldId: 'custpage_sublist_transaction',
                value: doc_number
            });
            newRecord.setCurrentSublistValue({
                sublistId: 'custpage_sublist',
                fieldId: 'custpage_sublist_item',
                value: item
            });
            newRecord.setCurrentSublistValue({
                sublistId: 'custpage_sublist',
                fieldId: 'custpage_sublist_amount',
                value: amount
            });
            newRecord.setCurrentSublistValue({
                sublistId: 'custpage_sublist',
                fieldId: 'custpage_sublist_status',
                value: status
            });
            newRecord.commitLine({ sublistId: 'custpage_sublist' });
        }
    }

    function getFormattedDate(date) {
        try {
            if (date) {
                var dateObj = new Date(date);
                var month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
                var day = ('0' + dateObj.getDate()).slice(-2);
                var year = dateObj.getFullYear();
                return month + "/" + day + "/" + year;
            }
        } catch (error) {
            console.error("Error encountered while formatting the order date", error.message);
        }
        return '';
    }

    return {
        fieldChanged: fieldChanged,
        showInformation: showInformation
    };
});