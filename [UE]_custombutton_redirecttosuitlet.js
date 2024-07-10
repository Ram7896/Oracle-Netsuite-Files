/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/redirect','N/record','N/ui/message'], function(redirect,record,message) {
    function beforeLoad(context) {
        log.debug('context:',context);
        if (context.type === context.UserEventType.VIEW) {
            var recordobj = context.newRecord;
            log.debug('recordobj',recordobj);
            var form = context.form;
            form.clientScriptModulePath = 'SuiteScripts/[CS]_entrypoints.js'; // Path to your client script
            var custombutton = form.addButton({
                id: 'custpage_custom_submit_button',
                label: 'Custom Submit',
                functionName: 'redirectToSuitelet()'
            });
            var out_put = recordobj.id;
                //var recordType = record.type;
                alert('recordid:' + out_put);
                var recObj = record.load({
                    type: record.Type.SALES_ORDER,
                    id: out_put
                });
                alert('record Obj' + recObj.id);
                var Memo = recObj.getValue({
                        fieldId: 'memo',
                    });
                    if(Memo){
                        form.removeButton('custpage_custom_submit_button');
                    }
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
                    log.debug('rate:',rate);
                    //alert('totalprice:'+ rate);
                    var amount = recObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: i
                    });
                    log.debug('amount:',amount);
                }
                //log.debug('totalprice:', totalPrice);
                // Calculate the difference
                var difference = amount - rate;
                log.debug('difference:',difference);
                if(Memo){
                if (difference !== 0) {
                    context.form.addPageInitMessage({
                        type: message.Type.WARNING,
                        message: 'Difference between the Rate and memo field'
                        });
                }
            }
        }
    }
    
    return {
        beforeLoad: beforeLoad
    };
});
