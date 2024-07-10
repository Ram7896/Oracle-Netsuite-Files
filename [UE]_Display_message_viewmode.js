/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/ui/message', 'N/log'], function(record, message, log) {

    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            var newRecord = context.newRecord;
            var memo = newRecord.getValue({
                fieldId: 'memo'
            });
            if (!memo) {
            context.form.addPageInitMessage({
                type: message.Type.WARNING,
                message: 'missing the memo value'
                });
            }
        }
    }
    return {
        beforeLoad:beforeLoad
    };
});
/**

 
on sales order you need to show warning 
 
like if user forgot entering the memo then once user saved the record it says you forgot the memo 

after saved record this message should show
 */