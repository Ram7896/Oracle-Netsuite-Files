/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/record', 'N/runtime', 'N/ui/dialog','./NSI_CM_InputDialog'],
    function (url, currentRecord, record, runtime, dialog,nsiInputDialog) {
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
                    fieldId: 'memo'
                });
                alert('reason:' + reason);
                // Reject the Sales Order
                var setStatus = recObj.setValue({
                    fieldId: 'custbodystatus',
                    value: '2'
                });
                alert('Status set successfully:' + setStatus);
                if (setStatus) {
                    if (reject !== null) {
                        var options = {
                            title: 'Input Dialog',
                            message: 'Please enter your rejection reason below:',
                            buttons: [{
                                label: 'Ok', 
                                value: 1
                            },{
                                label: 'Cancel',
                                value: 2
                            }],
                            textarea: {
                                rows: 6,
                                cols: 48,
                                isMandatory: true,
                                caption: 'Rejection Reason',
                                actionButtons: [1]
                            }
                        };
                 
                        var failure = function (reason) {
                            console.log('Failure: ' + reason);
                        }
                         
                        var success = function (result, values) {
                            alert('Input dialog closed by clicking button ' + result + ' | value: ' + values);
                            recObj.setValue({
                                fieldId: 'memo',
                                value:values,
                                ignoreFieldChange: true
                            });
                            recObj.save();

                        // Reload the current page
                        window.location.reload();
                        }
                         
                        nsiInputDialog.create(options, success, failure);
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
