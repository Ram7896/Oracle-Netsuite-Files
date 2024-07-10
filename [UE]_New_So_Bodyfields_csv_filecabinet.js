/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/file'], function(record, file) {

    function afterSubmit(context) {
        var salesOrder = context.newRecord;
        log.debug('salesorder:',salesOrder);
        var salesOrderId = context.newRecord.id;
        var salesOrder = record.load({ 
            type: record.Type.SALES_ORDER, 
            id: salesOrderId, 
            isDynamic: true 
        });

        // Get header fields
        var customer = salesOrder.getText({ fieldId: 'entity' });
        var date = salesOrder.getValue({ fieldId: 'trandate' });
        var exchangeRate = salesOrder.getValue({ fieldId: 'exchangerate' });
        var currency = salesOrder.getText({ fieldId: 'currency' });
        var status = salesOrder.getText({ fieldId: 'orderstatus' });
        var salesRep = salesOrder.getText({ fieldId: 'salesrep' });

        // Create CSV content
        var csvContent = "Field Name,Field Value\n";
        csvContent += "Customer," + customer + "\n";
        csvContent += "Date," + date + "\n";
        csvContent += "Exchange Rate," + exchangeRate + "\n";
        csvContent += "Currency," + currency + "\n";
        csvContent += "Status," + status + "\n";
        csvContent += "Sales Rep," + salesRep + "\n";

        // Create/Update CSV file
        var csvFile = file.create({
            name: salesOrderId + '.csv',
            fileType: file.Type.CSV,
            contents: csvContent
        });
        if (context.type === context.UserEventType.CREATE) {
            // Create new CSV file
            csvFile.folder = 684; // Specify folder ID where CSV files should be stored
            var fileId = csvFile.save();
        } else if (context.type === context.UserEventType.EDIT) {
            // Update existing CSV file
            csvFile.folder = 684; // Specify folder ID where CSV files are stored
            csvFile.fileId = 684; // Specify existing CSV file ID
            csvFile.save();
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
