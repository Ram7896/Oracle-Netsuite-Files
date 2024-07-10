/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/ui/message', 'N/log', 'Display_message_viewmode_library.js'],
    function (record, message, log, approvalLibrary) {

        function beforeLoad(context) {
            try {
                if (context.type === context.UserEventType.VIEW) {
                    var newRecord = context.newRecord;
                    var memo = newRecord.getValue({
                        fieldId: 'memo'
                    });
                    if (!memo) {
                        approvalLibrary.onFull(context);
                    }
                }
            } catch (e) {
                log.debug('Error:', e);
            }
        }
        return {
            beforeLoad: beforeLoad
        };
    });