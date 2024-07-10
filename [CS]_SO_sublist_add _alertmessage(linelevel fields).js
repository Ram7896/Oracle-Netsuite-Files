/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
var flag = '';
define(['N/ui/dialog', 'N/currentRecord'], function (dialog, currentRecord) {

    function validateLine(context) {
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        // Assuming the sublist ID is 'recmachcustrecord_sublist'
        if (sublistName === 'item') {
            var amount = currentRecord.getCurrentSublistValue({
                sublistId: sublistName,
                fieldId: 'amount'
            });
            var price = currentRecord.getCurrentSublistValue({
                sublistId: sublistName,
                fieldId: 'rate'
            });
            // Check if both amount and price fields have values
            if (amount && price) {
                var difference = amount - price;
                // Check if there is a difference between amount and price
                if (difference !== 0) {
                    var text = "Press a button!\nEither OK or Cancel.";
                    if (confirm(text) == true) {
                        text = "You pressed OK!";
                        flag=true;
                    } else {
                        text = "You canceled!";
                        flag=false;
                    }
                }
            }
        }
        alert(text);
        return flag;
    }
    return {
        validateLine: validateLine
    };
});

