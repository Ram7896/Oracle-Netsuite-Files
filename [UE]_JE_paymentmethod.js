/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/runtime','N/email'],
	function(record,runtime,email) {
        function afterSubmit(context) {
            if(context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT){
                var newRecord=context.newRecord;
                var tranid = newRecord.getValue({
                    fieldId: 'tranid'
                  });
                  log.debug('trainid:',tranid);
                  newRecord.setValue({
                    fieldId:'custbody_payment',
                    value:tranid
                  });
            }
        }
    return{
        afterSubmit:afterSubmit
    };
}
);