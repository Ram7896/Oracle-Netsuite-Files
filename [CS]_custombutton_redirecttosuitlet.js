/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/record','N/runtime'],
    function (url, currentRecord, record,runtime) {
        function pageInit(context) {
            // Create a button
            // alert('pageinit triggered');
        }
        var totalAmount = 0;
        var totalPrice = 0;
        // Client Script Function
        function redirectToSuitelet() {
            try {
                alert('submit button triggered');
                var recordobj = currentRecord.get();
                var out_put = recordobj.id;
                var recordType = record.type;
                alert('recordid:' + out_put);
                var recObj = record.load({
                    type: record.Type.SALES_ORDER,
                    id: out_put
                });
                alert('record Obj' + recObj.id);
                var lineCount = recObj.getLineCount({
                    sublistId: 'item' 
                });
                alert('sublistlinecount:' + lineCount);
                // Initialize variables to store total amount and total price
                // Calculate total amount and total price from sublist
                for (var i = 0; i < lineCount; i++) {
                    var rate = recObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: i
                    });
                    //alert('totalprice:'+ rate);
                    var amount = recObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: i
                    });
                    //log.debug('totalamount:', totalAmount);
                    // alert('totalamount:-'+ price);
                    console.log("Rate:", rate, "Amount:", amount);
                }
                //log.debug('totalprice:', totalPrice);
                // Calculate the difference
                var difference = amount - rate;
                alert('difference for line ' + (i + 1) + ': ' + difference);
                // alert('difference:'+difference);
                //log.debug('difference:', difference);
                // Check if there's a difference
                if (difference !== 0) {
                    // alert('redirect suitelet triggered');
                    var output = url.resolveScript({
                        scriptId: 'customscript802',
                        deploymentId: 'customdeploy1',
                        params:
                        {
                            custscript_id: out_put,
                            custscript_type: recordType
                        },
                        returnExternalUrl: true
                    });
                    //window.open(output, 'width=500,height=400,scrollbars=no');
                    window.location.href = '' + output;
                }
            }
            catch (e) {
                alert('error in function', e);
            }
        }
        /*function submit(context){
            try{
                var record_id = currentRecord.get();
                var internalid = record_id.getValue({
                    fieldId:'custpage_hidden_field'
                })
                alert('internalid:'+internalid);
                if (internalid) {
                    // Load the Sales Order record
                    var salesOrder = record.load({
                        type: record.Type.SALES_ORDER,
                        id: internalid
                    });
                    // Populate the memo field
                salesOrder.setValue({
                    fieldId: 'memo',
                    value: 'Memo populated by Suitelet submit button'
                });

                // Save the Sales Order record
                var salesOrderUpdatedId = salesOrder.save();
                alert('record saved successfully');
            }
        }
            catch(e){
                alert('error in submit:'+e);
            }
        }*/
        return {
            pageInit: pageInit,
            redirectToSuitelet: redirectToSuitelet
            //submit:submit
        };
    });
