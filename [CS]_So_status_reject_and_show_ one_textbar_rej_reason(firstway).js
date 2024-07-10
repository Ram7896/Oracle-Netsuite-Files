/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/record', 'N/runtime', 'N/ui/dialog'],
    function (url, currentRecord, record, runtime, dialog) {
        function pageInit(context) {
            // alert('pageinit triggered');
        }
        // Client Script Function
        function reject() {
            try {
                alert('submit button triggered');
                var recordobj = currentRecord.get();
                var out_put = recordobj.id;
                var recordType = record.type;
                alert('recordid:' + out_put);

                // Load the record
                var recObj = record.load({
                    type: record.Type.SALES_ORDER,
                    id: out_put,
                    isDynamic: true
                });
                alert('record Obj' + recObj.id);

                // Get the value of the reject field
                var reject = recObj.getValue({
                    fieldId: 'custpage_reject'
                });
                alert('reject:' + reject);
                var reason = recObj.getValue({
                    fieldId: 'custbodyreason'
                });
                alert('reason:' + reason);
                // Reject the Sales Order
                var setStatus = recObj.setValue({
                    fieldId: 'custbodystatus',
                    value: '1'
                });
                alert('Status set successfully:' + setStatus);
                if (setStatus) {
                    if (reject !== null) {
                        var rejectionReason = prompt("Please enter the reason for rejection:");
                        recObj.setValue({
                            fieldId: 'custbodyreason',
                            value: rejectionReason,
                            ignoreFieldChange: true
                        });

                        recObj.save();

                        // Reload the current page
                        window.location.reload();
                    }
                }
            } catch (e) {
                alert('Error in function: ' + e.message);
            }

        }
        return {
            pageInit: pageInit,
            reject: reject
        };
    });
