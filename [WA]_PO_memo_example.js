/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */
define(['N/record', 'N/runtime'], function (record, runtime) {
    function onAction(scriptcontext) {
        try {
            log.debug('Script started');
            var testparam = runtime.getCurrentScript().getParameter({
                name: 'custscript4'
            });
            log.debug('test param:', testparam);
            var poRec = scriptcontext.newRecord;
            var linecount = poRec.getLineCount({
                sublistId: 'item'
            });
            for (var i = 0; i < linecount; i++) {
                var item=poRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                    });
                    log.debug('item at:'+i, item);
            }
        } catch (error) {
            log.error('Error occurred', error);
        }
    }
    return {
        onAction: onAction
    };
});