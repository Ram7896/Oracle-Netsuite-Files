/**
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 */
define(['N/record'], function(record) {

    function onAction(context) {
        var newRecord = context.newRecord;

        try {
            var soId = newRecord.id;
            var soRecord = record.load({
                type: record.Type.SALES_ORDER,
                id: soId,
                isDynamic: true
            });

            // Approve the Sales Order
            soRecord.setValue({
                fieldId: 'orderstatus',
                value: 'B' // Status code for "Pending Fulfillment"
            });

            // Save the Sales Order
            soRecord.save();

        } catch (e) {
            log.error('Error Approving Sales Order', e.message);
        }
    }

    return {
        onAction: onAction
    };
});
