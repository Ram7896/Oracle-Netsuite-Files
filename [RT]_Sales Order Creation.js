/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record'], function(record) {

  function post(context) {
    log.debug("Context:",context);
    try {
      var salesOrder = record.create({
        type: record.Type.SALES_ORDER,
        isDynamic: true
      });

      // Set customer
      salesOrder.setValue({ fieldId: 'entity', value: context.entity });

      // Loop through items array
     for (let i = 0; i < context.items.length; i++) {
        salesOrder.selectNewLine({ sublistId: 'item' });
       const element = context.items[i];
       log.debug("Element:",element);
        salesOrder.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          value: element.item
        });
        salesOrder.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          value: element.quantity
        });
        salesOrder.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'amount',
          value: element.amount
        });
        salesOrder.commitLine({ sublistId: 'item' });
     }
      var salesOrderId = salesOrder.save();
      return {
        success: true,
        salesOrderId: salesOrderId
      };

    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  return {
    post: post
  };
});


{
  "entity": "323",
  "items": [
    {
      "item": "349",
      "quantity": "2",
      "amount":"30"
    }
  ]
}
