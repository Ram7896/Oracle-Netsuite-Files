/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/record'], function (search, record) {

  function getInputData() {
    // Retrieve the data to process
    var salesOrderSearch = search.create({
      type: search.Type.SALES_ORDER,
      filters: [
        ['status', 'anyof', 'SalesOrd:F'], // Filter by sales orders in "Fulfilled" status
        'AND',
        ['mainline', 'is', 'T'] // Filter by mainline sales orders only
      ],
      columns: ['internalid', 'total'] // Columns to retrieve
    });

    return salesOrderSearch;
  }

  function map(context) {
    var salesOrderId = context.key;
    var salesOrderTotal = parseFloat(context.value);

    // Perform some calculations or operations on each sales order
    var discountedTotal = salesOrderTotal * 0.9; // Apply a 10% discount

    // Emit the processed data to be reduced
    context.write({
      key: salesOrderId,
      value: discountedTotal
    });
  }

  function reduce(context) {
    var salesOrderId = context.key;
    var discountedTotal = context.values[0];

    // Update the sales order record with the discounted total
    var salesOrder = record.load({
      type: record.Type.SALES_ORDER,
      id: salesOrderId,
      isDynamic: true
    });

    salesOrder.setValue({
      fieldId: 'total',
      value: discountedTotal
    });

    salesOrder.save();
  }

  function summarize(summary) {
    // Log the script's execution statistics
    log.debug('Map/Reduce Usage Consumed', summary.usage);
    log.debug('Number of Queues', summary.concurrency);
    log.debug('Number of Yields', summary.yields);
  }

  return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
    summarize: summarize
  };

});