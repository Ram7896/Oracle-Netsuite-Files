/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

define(['N/query','N/file'], function (query,file) {
    function execute(context) {
        try {
            // Your code logic goes here
            const sql = `SELECT 
            BUILTIN_RESULT.TYPE_INTEGER(Vendor.custentity_mb_payment_works_id) AS custentity_mb_payment_works_id, 
            BUILTIN_RESULT.TYPE_STRING(Vendor.externalid) AS externalid, 
            BUILTIN_RESULT.TYPE_INTEGER(vendorAddressbook_SUB.internalid) AS internalid, 
            BUILTIN_RESULT.TYPE_STRING(Vendor.companyname) AS companyname, 
            BUILTIN_RESULT.TYPE_STRING(vendorAddressbook_SUB.label) AS label, 
            BUILTIN_RESULT.TYPE_STRING(vendorAddressbook_SUB.addr1) AS addr1, 
            BUILTIN_RESULT.TYPE_STRING(vendorAddressbook_SUB.addr2) AS addr2, 
            BUILTIN_RESULT.TYPE_STRING(vendorAddressbook_SUB.city) AS city, 
            BUILTIN_RESULT.TYPE_STRING(vendorAddressbook_SUB.dropdownstate) AS dropdownstate, 
            BUILTIN_RESULT.TYPE_STRING(vendorAddressbook_SUB.zip) AS zip, 
            BUILTIN_RESULT.TYPE_STRING(Vendor.custentity_taxid_raw) AS custentity_taxid_, 
            BUILTIN_RESULT.TYPE_STRING(Vendor.email) AS email, 
            BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_2663_ENTITY_BANK_DETAILS.custrecord_2663_entity_acct_no) AS custrecord_2663_entity_acct_no, 
            BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_2663_ENTITY_BANK_DETAILS.custrecord_2663_entity_bank_no) AS custrecord_2663_entity_bank_no, 
            BUILTIN_RESULT.TYPE_INTEGER(CUSTOMRECORD_2663_ENTITY_BANK_DETAILS.custrecord_2663_entity_country) AS custrecord_2663_entity_country
          FROM 
            Vendor, 
            (SELECT 
              vendorAddressbook.entity AS entity, 
              vendorAddressbook.entity AS entity_join, 
              vendorAddressbook.internalid AS internalid, 
              vendorAddressbook.label AS label, 
              vendorAddressbookEntityAddress.addr1 AS addr1, 
              vendorAddressbookEntityAddress.addr2 AS addr2, 
              vendorAddressbookEntityAddress.city AS city, 
              vendorAddressbookEntityAddress.dropdownstate AS dropdownstate, 
              vendorAddressbookEntityAddress.zip AS zip
            FROM 
              vendorAddressbook, 
              vendorAddressbookEntityAddress
            WHERE 
              vendorAddressbook.addressbookaddress = vendorAddressbookEntityAddress.nkey(+)  AND UPPER(vendorAddressbook.label) LIKE '%REMIT%'
            ) vendorAddressbook_SUB, 
            CUSTOMRECORD_2663_ENTITY_BANK_DETAILS
          WHERE 
            ((Vendor.ID = vendorAddressbook_SUB.entity(+) AND Vendor.ID = CUSTOMRECORD_2663_ENTITY_BANK_DETAILS.custrecord_2663_parent_vendor(+)))
             AND Vendor.lastmodifieddate BETWEEN BUILTIN.RELATIVE_RANGES('TODAY', 'START', 'DATETIME_AS_DATE') AND BUILTIN.RELATIVE_RANGES('TODAY', 'END', 'DATETIME_AS_DATE')`;
            const resultSet = query.runSuiteQL({ query: sql });
            const results = resultSet.asMappedResults();
            log.debug('results', results);
            const csvArray = [];
            csvArray.push("RequestID,VendorNum,SiteCode,SupplierName,AddressType,Address1,Address2,City,State,Country,Zipcode,TIN,ContactEmail,BankAcctNum,BankName,RoutingNum,NameOnAcct,BankCountry,PaymentMethod")
            log.debug("results", results);
            results.forEach(result => {
                let paymentWorksID = result.custentity_mb_payment_works_id ? result.custentity_mb_payment_works_id : '';
                let externalID = result.externalid ? result.externalid : '';
                let internalID = result.internalid ? result.internalid : '';
                let companyName = result.companyname ? result.companyname : '';
                let label = result.label ? result.label : '';
                let addr1 = result.addr1 ? result.addr1 : '';
                let addr2 = result.addr2 ? result.addr2 : '';
                let city = result.city ? result.city : '';
                let dropdownState = result.dropdownstate ? result.dropdownstate : '';
                let zip = result.zip ? result.zip : '';
                let taxID = result.custentity_taxid_ ? result.custentity_taxid_ : '';
                let email = result.email ? result.email : '';
                let acctNo = result.custrecord_2663_entity_acct_no ? result.custrecord_2663_entity_acct_no : '';
                let bankNo = result.custrecord_2663_entity_bank_no ? result.custrecord_2663_entity_bank_no : '';
                let country = result.custrecord_2663_entity_country ? result.custrecord_2663_entity_country : '';
                 

                let csvString =   paymentWorksID
                csvString += ',' +  externalID
                csvString += ',' +  internalID
                csvString += ',' +  '"' + companyName + '"'
                csvString += ',' +  `"${label}"`
                csvString += ',' +  `"${addr1}"`
                csvString += ',' +  `"${addr2}"`
                csvString += ',' +  '"' + city + '"'
                csvString += ',' +  dropdownState
                csvString += ',' +  "Country"
                csvString += ',' +  zip
                csvString += ',' +  taxID
                csvString += ',' +  email
                csvString += ',' +  acctNo
                csvString += ',' +  "Bank Name"
                csvString += ',' +  bankNo
                csvString += ',' +  "Bank Name"
                csvString += ',' +  country
                csvString += ',' +  "Payment Method"
                csvArray.push(csvString);
            });
            let csvReport = csvArray.join("\n");
            log.debug("csvReport", csvReport);
      var fileObj = file.create({
        name: "PaymentWorksSupplierCSV.csv",
        fileType: file.Type.CSV,
        contents: csvReport,
        encoding: file.Encoding.UTF8,
        folder: 346520,
        isOnline: true,
      });
      var fileId = fileObj.save();
      log.debug("fileId", fileId);
        } catch (error) {
            log.error('Error executing script', error);
        }
    }

    return {
        execute: execute
    };
});