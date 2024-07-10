/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/search', 'N/record'],
    function (currentRecord, search, record) {
        function pageInit() {
            alert('entered');
        }
        var pendingFulfillmentCount = 0;
        var pendingBillingCount = 0;
        var billedCount = 0;

        function searchTransaction(context) {
            try {
                alert('search transition triggered');

                var recordObj = currentRecord.get();
                var customerId = recordObj.getValue({
                    fieldId: 'custpag_customer'
                });
                alert('customerid:' + customerId);
                var date = recordObj.getValue({ fieldId: 'custpage_date' });
                alert('date:' + date);
                if (!customerId) {
                    return;
                }

                alert('saved search is created on SO');
                if(customerId){
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    filters: [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["entity", "anyof", customerId],
                        "AND",
                        ["mainline", "is", "T"]
                    ],
                    columns: [
                        search.createColumn({name: "statusref", label: "Status"})
                    ]
                });

                // Run the search and retrieve results
                var searchResults = salesorderSearchObj.run().getRange({
                    start: 0,
                    end: 1000 // Increase the limit if necessary
                });
                var count=searchResults.length;
                //alert('searchresultcount:'+count);
                // Iterate through search results and count statuses
                searchResults.forEach(function(result) {
                    var status = result.getValue('statusref');
                    //alert('status:'+status);
                    if (status == 'pendingFulfillment') {
                        pendingFulfillmentCount++;

                    } else if (status == 'pendingBilling') {
                        pendingBillingCount++;
                    } else if (status == 'fullyBilled') {
                        billedCount++;
                    }
                });
            }
                // Set counts into fields on the current record
                var fulfillment = recordObj.setValue({
                    fieldId: 'pending_fulfillment',
                    value: pendingFulfillmentCount
                });
                var pen_billing = recordObj.setValue({
                    fieldId: 'pending_billing',
                    value: pendingBillingCount
                });
                var billed = recordObj.setValue({
                    fieldId: 'billed',
                    value: billedCount
                });

            } catch (e) {
                console.error('Error:', e);
                alert('An error occurred: ' + e.message);
            }
        }

        return {
            pageInit: pageInit,
            searchTransaction: searchTransaction
        };
    }
);
