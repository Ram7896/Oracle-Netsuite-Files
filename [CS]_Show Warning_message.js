/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/ui/message', 'N/ui/dialog'], function(currentRecord, message, dialog) {

    function showAlert() {
        var currentRec = currentRecord.get();
        var memo = currentRec.getValue({
            fieldId: 'memo'
        });

        if (!memo) {
            // Memo is empty, display warning message
            var msg = message.create({
                title: 'Warning',
                message: 'You forgot to enter the memo!',
                type: message.Type.WARNING
            });

            // Show warning message
            msg.show();
        }
    }

    function saveRecord(context) {
        showAlert();
       return false; // Returning true to allow the record to be saved
    }

    

    return {
        saveRecord: saveRecord
    };

});
