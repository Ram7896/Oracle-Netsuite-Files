/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

define(["N/query", "N/file"], function (query, file) {
  function execute(context) {

    function getVendorSiteCode(vendorID) {
      const sql = `SELECT 
      vendorAddressbook.internalid AS internalid
    FROM 
      Vendor, 
      vendorAddressbook
    WHERE 
      Vendor.ID = vendorAddressbook.entity
       AND Vendor.ID = '${vendorID}' AND UPPER(vendorAddressbook.label) LIKE UPPER('%remit%')`
       const resultSet = query.runSuiteQL({ query: sql });
       const results = resultSet.asMappedResults();
       log.debug("results", results);
        return results[0] ? results[0].internalid : "";
    }

    const objectToCsv = function (data, headersArr) {
      var csvArray = [];
      csvArray.push("InvoiceNum,PurchaseOrder,RefKey,VendorNum,SiteCode,InvoiceAmt,Currency,InvoiceDate,SchedPayDate,ActualPayDate,ActualPaidAmt,PayDocNum,StatusCode");
      data.forEach(function (item) {

       // item.transactionnumber,
        //       item.ponumber,
        //       item.refkey,
        //       getVendorSiteCode(item.vendorid), // this is blank
        //       item.amount,
        //       item.currency,
        //       item.date,
        //       "Need to add",
        //       "Need to add",
        //       item.paidamt,
        //       "Need to add",
        //       "Need to add",
        log.debug("item", item)
        let csvString =  item.transactionnumber;
        csvString += ',' + item.ponumber;
        csvString += ',' + item.refkey;
        csvString += ',' + item.vendornumb;
        csvString += ',' + getVendorSiteCode(item.vendorid);
        csvString += ',' +item.amount;
        csvString += ',' + item.currency;
        csvString += ',' + item.date;
        csvString += ',' + "";
        csvString += ',' + "";
        csvString += ',' + item.paidamt;
        csvString += ',' + "";
        csvString += ',' + "";
        csvArray.push(csvString);
      });
      let csvReport = csvArray.join("\n");
      return csvReport;
    };

   
    try {
      // Your code logic goes here
      const sql = `SELECT
      transaction.transactionnumber as transactionnumber,
      transaction.tranid as ponumber,
      transaction.id as refkey,
      entity.entityid as vendornumb,
      entity.id as vendorid,
      ABS(transaction.foreignTotal) as amount,
      BUILTIN.DF(transaction.currency) as currency,
      transaction.trandate as date,
      transaction.foreignAmountPaid as paidamt,
      transaction.transaction.foreignAmountUnpaid as unpaidamt,
      transaction.entity,
      transaction.entity as vendor
      FROM transaction
      INNER JOIN entity ON transaction.entity = entity.id
      WHERE recordtype = 'vendorbill' AND transaction.createddate BETWEEN BUILTIN.RELATIVE_RANGES('TODAY', 'START', 'DATETIME_AS_DATE') AND BUILTIN.RELATIVE_RANGES('TODAY', 'END', 'DATETIME_AS_DATE')`;
      const resultSet = query.runSuiteQL({ query: sql });
      const results = resultSet.asMappedResults();
      log.debug('results', results)
      const headersArr =  ["InvoiceNum", "PurchaseOrder", "Ref Key", "Site Code", "InvoiceAmt", "Currency", "InvoiceDate", "SchedPayDate", "ActualPayDate", "ActualPaidAmt","PayDocNum","StatusCode"]

      const csvContents = objectToCsv(results, headersArr)
      log.debug('csvContents', csvContents)
      var fileObj = file.create({
        name: "PaymentWorksCSV.csv",
        fileType: file.Type.CSV,
        contents: csvContents,
        encoding: file.Encoding.UTF8,
        folder: 346521,
        isOnline: true,
      });
      var fileId = fileObj.save();
      log.debug("fileId", fileId);
    } catch (error) {
      log.error("Error occurred: " + error.message);
    }
  }

  return {
    execute: execute,
  };
});
