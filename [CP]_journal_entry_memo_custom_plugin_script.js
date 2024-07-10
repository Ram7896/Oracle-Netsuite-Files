function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    nlapiLogExecution('DEBUG', 'customizeGlImpact: ', 'inside function');
    var newLine = customLines.addNewLine();
    newLine.setDebitAmount(20);
    newLine.setMemo('For custom plugin testing purpose debit amount');
    newLine.setAccountId(standardLines.getLine(0).getAccountId());
    var newLine = customLines.addNewLine();
    newLine.setCreditAmount(20);
    newLine.setMemo('For custom plugin testing purpose credit amount');
    newLine.setAccountId(standardLines.getLine(1).getAccountId());
}

