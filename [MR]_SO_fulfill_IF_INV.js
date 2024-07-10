/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */

define(['N/record', 'N/email', 'N/search'], function(record, email, search) {

    function getInputData() {
        // Fetch pending sales orders to fulfill
        var salesOrderSearch = search.create({
            type: "salesorder",
            settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
            filters:
            [
               ["type","anyof","SalesOrd"], 
               "AND", 
               ["status","anyof","SalesOrd:B"], 
               "AND", 
               ["mainline","is","T"]
            ],
            columns: ['internalid']
        });
        var searchResultCount = salesOrderSearch.runPaged().count;
        log.debug("salesorderSearchObj result count",searchResultCount);
      return salesOrderSearch;
    }
    function map(context) {
        var salesOrderId = JSON.parse(context.value);
        log.debug("salesorderid:",salesOrderId);
        var internalId = salesOrderId.id;
        log.debug('internalid:',internalId);
        // Approve the sales order
        record.submitFields({
            type: record.Type.SALES_ORDER,
            id: internalId,
            values: {
                orderstatus: 'B' // 'B' represents 'Approved'
            },
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true
            }
        });
        // Fulfill the sales order
      log.debug('fulfillment entred');
        var fulfillment = record.transform({
            fromType: record.Type.SALES_ORDER,
            fromId: internalId,
            toType: record.Type.ITEM_FULFILLMENT,
            isDynamic: true
        });
        log.debug('shipping status entred');
        fulfillment.setValue({
            fieldId:'shipstatus',
            value:'C'
        })
        var fulfillmentId = fulfillment.save();
        log.debug('fulfillmentid:',fulfillmentId);
        // Create invoice
        var invoice = record.transform({
            fromType: record.Type.SALES_ORDER,
            fromId: internalId,
            toType: record.Type.INVOICE,
            isDynamic: true
        });

        var invoiceId = invoice.save();
        log.debug("invoiceid:",invoiceId);
        // Emit the sales order, fulfillment, and invoice IDs
        context.write({
            key: internalId,
            value: {
                salesOrderId: internalId,
                fulfillmentId: fulfillmentId,
                invoiceId: invoiceId
            }
        });
    }
   /* function reduce(context) {
        var salesOrderId = context.key;
        log.debug("reduceid:",salesOrderId);
        var values = context.values;
        log.debug("reduce values:",values);
        var csvContent = "Sales Order,Item Fulfillment,Invoice\n";

        // Iterate through each sales order and its related fulfillment and invoice
        values.forEach(function(value) {
            csvContent += value.salesOrderId + "," + value.fulfillmentId + "," + value.invoiceId + "\n";
        });

        // Send email with CSV attachment
        email.send({
            author: 757, // Use internal ID of the email sender
            recipients: 'medapati-rama-sudhakar.reddy@capgemini.com', // Replace with customer's email
            subject: 'Sales Order Fulfillment Report',
            body: 'Please find attached the sales order fulfillment report.',
            attachments: [
                email.createAttachment({
                    contents: csvContent,
                    fileName: 'sales_order_fulfillment_report.csv',
                    mimeType: 'text/csv'
                })
            ]
        });
    }*/
    return {
        getInputData: getInputData,
        map: map,
        //reduce: reduce
    };

});
