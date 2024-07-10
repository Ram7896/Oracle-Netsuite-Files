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
           form.clientScriptModulePath = '[CS]_So_status_reject_and_show_ one_textbar_rej_reason.js'; 
            var custombutton = form.addButton({
                id: 'custpage_reject',
                label: 'Reject',
                functionName: 'reject()'
            });
            
        }
    }
    
    return {
        beforeLoad: beforeLoad
    };
});
