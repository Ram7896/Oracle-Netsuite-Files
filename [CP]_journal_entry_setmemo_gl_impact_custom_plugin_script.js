function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    nlapiLogExecution('DEBUG', 'customizeGlImpact: ', 'inside function');

    // Get the internal ID of the transaction record
    var transactionId = transactionRecord.getId();

    // Load the transaction record
    var loadedTransaction = nlapiLoadRecord(transactionRecord.getRecordType(), transactionId);

    // Loop through the line items of the transaction record
    var lineCount = loadedTransaction.getLineItemCount('line');
    for (var i = 1; i <= lineCount; i++) {
        // Get the memo value from each line
        var lineMemo = loadedTransaction.getLineItemValue('line', 'custcol_memo', i);
        
        // Set the memo value for the 'memo' field on the same line
        loadedTransaction.setLineItemValue('line', 'memo', i, lineMemo);
        
        // Log the memo value
        nlapiLogExecution('DEBUG', 'Memo Value for Line ' + i + ':', lineMemo);
    }
    // Save the transaction record
    var updatedTransactionId = nlapiSubmitRecord(loadedTransaction, true, true);
    nlapiLogExecution('DEBUG', 'Memo Values Set for Transaction Record');
}
