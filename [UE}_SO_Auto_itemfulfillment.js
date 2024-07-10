/**
 * if we create sales order then automatically item fulfillment should be created.
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/transaction'], function (log, record, transaction) {

    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            try {
                // Your custom code for approval, fulfillment, and item fulfillment
                var salesOrderId = context.newRecord.id;

                // Approve the sales order
                record.submitFields({
                    type: record.Type.SALES_ORDER,
                    id: salesOrderId,
                    values: {
                        orderstatus: 'B' // 'B' represents 'Approved'
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
                // Fulfill the sales order
                var fulfillmentId = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: salesOrderId,
                    toType: record.Type.ITEM_FULFILLMENT
                }).save();
                log.debug({
                    title: 'Sales Order Processed',
                    details: 'Sales Order ' + salesOrderId + ' approved and fulfilled.'
                });
            } catch (e) {
                log.error({
                    title: 'Error Processing Sales Order',
                    details: e.toString()
                });
            }
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
