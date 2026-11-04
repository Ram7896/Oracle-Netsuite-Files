/*************************************************************************************************************************************
 * Script Name         :   Fonteva Journal Entry Creation
 * Author              :   Rama Sudhakar
 * Creation date       :   28th June 2024
 * Company             :   Capgemini India
 * Description         :  
 * Change Log            :   ||    Changed By         ||    Date        ||            Description    
 ********************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/file', 'N/search', 'N/log', 'N/record', 'N/runtime', "./lib/Error Handling Library.js"],
    function (file, search, log, record, runtime, errorLib) {

        function getInputData() {
            try {
                const currentScript = runtime.getCurrentScript();
                var revRecFolderId = currentScript.getParameter({ name: "custscript_ada_fnt_process_folder" });
                log.debug("Folder ID is", revRecFolderId);

                var fileSearch = search.create({
                    type: "file",
                    filters: [["folder", "anyof", revRecFolderId]],
                    columns: ['internalid']
                });

                return fileSearch.run().getRange({ start: 0, end: 1000 });

            } catch (e) {
                log.error({ title: 'Error in getInputData', details: e });
            }
        }

        function map(context) {
            try {
                var fileId = JSON.parse(context.value).id;
                log.debug("File ID:", fileId);

                var fileObj = file.load({ id: fileId });
                var fileContents = fileObj.getContents();
                var splitCells = fileContents.split('\n');

                for (var i = 1; i < splitCells.length - 1; i++) {
                    var cells = splitCells[i].split(',').map(cell => cell.trim());
                    log.debug("Cells:", cells);
                    context.write({ key: cells[0], value: cells });
                }
                var scriptObj = runtime.getCurrentScript();
                var processedFolder = scriptObj.getParameter({ name: "custscript_ada_je_proces_folder" });
                var fileName = fileObj.name;

                var newFile = file.create({
                    name: fileName,
                    fileType: file.Type.CSV,
                    contents: fileContents,
                    folder: processedFolder
                });
                var newFileID = newFile.save();
                log.debug("New file created and saved with ID:", newFileID);

                file.delete({
                    id: fileId
                });
                log.debug("file has been deleted");

            } catch (e) {
                log.error({ title: 'Error in map', details: e });
            }
        }

        function reduce(context) {
            try {
                var journalEntryJSON = {};

                for (var i = 0; i < context.values.length; i++) {
                    var cells = JSON.parse(context.values[i]);
                    if (i == 0) {
                        journalEntryJSON = {
                            "ExternalID": cells[0],
                            "ExternalTransaction": cells[1],
                            "FontevaOrder": cells[2],
                            "Date": cells[3],

                            "journalEntryChildLineDetialsJSON": [{
                                "Entity": cells[4],
                                "AccountAvalaraCode": cells[5],
                                "ContactUUID": cells[6],
                                "RevRecItem": cells[7],
                                "Program": cells[8],
                                "Account": cells[9],
                                "Debit": cells[10],
                                "Credit": cells[11],
                                "ExternalLineId": cells[12],

                            }]

                        };

                    }
                    else {
                        journalEntryJSON.journalEntryChildLineDetialsJSON.push(
                            {
                                "Entity": cells[4],
                                "AccountAvalaraCode": cells[5],
                                "ContactUUID": cells[6],
                                "RevRecItem": cells[7],
                                "Program": cells[8],
                                "Account": cells[9],
                                "Debit": cells[10],
                                "Credit": cells[11],
                                "ExternalLineId": cells[12],
                            }
                        )
                    }

                }
                if(journalEntryJSON.FontevaOrder!== ""){
                journalEntryJSON = searchSalesOrder(journalEntryJSON);
                log.debug("Sales Order Internal ID:", journalEntryJSON);

                if (journalEntryJSON.soInternalId) {
                    journalEntryJSON = journalCreation(journalEntryJSON);
                    log.debug("Journal Entry Created ID:", journalEntryJSON);
                    if(journalEntryJSON.journalId == "")
                        {
                            context.write({
                                key: journalEntryJSON.ExternalID,
                                value: {
                                    "Error": journalEntryJSON.Error,
                                    "ErrorMessage": journalEntryJSON.errorMessage,
                                    "ExternalTransactionId": journalEntryJSON.ExternalTransaction
                                }
                            });
                        }
                }
                else{
                    context.write({
                        key: journalEntryJSON.ExternalID,
                        value: {
                            "Error": "Searching Sales Order in Netsuite",
                            "ErrorMessage": "Sales Order is not Present in Netsuite",
                            "ExternalTransactionId": journalEntryJSON.ExternalTransaction
                        }
                    });
                }
            }
            else{
                context.write({
                    key: journalEntryJSON.ExternalID,
                    value: {
                        "Error": "Missing the Required Field Sales Order ExternalId",
                        "ErrorMessage": "Missing the Required Fields in Netsuite",
                        "ExternalTransactionId": journalEntryJSON.ExternalTransaction
                    }
                });
            }  
            } catch (e) {
                log.error({ title: 'Error in reduce', details: e });
            }
        }
        function summarize(context) {
            log.audit({
                title: 'Final Output',
                details: context
            });
            var inteface_error_handling_id = runtime
                .getCurrentScript()
                .getParameter("custscript_ada_je_error_handling");
            log.debug("inteface_error_handling_id", inteface_error_handling_id);

            var errorFolder = runtime.getCurrentScript().getParameter("custscript_ada_je_error_handler");
            log.debug("Error Folder Id", errorFolder);

            var errorFileContent = 'External Id,External Transaction No,Error Code,ErrorMessage \n';
            var noOfRows = 0;
            context.output.iterator().each(function (key, value) {
                noOfRows++;
                log.debug("no of rows:", noOfRows);
                var errorCode = JSON.parse(value);
                log.debug("Summarize Parse Values:", errorCode);
                if (errorCode.ErrorMessage) {
                    log.debug("errorCode", errorCode),
                        errorFileContent += (key + ' , ' + errorCode.ExternalTransactionId + ',' + errorCode.Error + ',"' + errorCode.ErrorMessage + '" \n');
                }
                return true;
            });
            log.debug("Error File Content data", errorFileContent);
            if (noOfRows > 0) {
                //Creating Error File
                log.debug("Current Date", new Date());
                log.debug("Converted Current Date", getFormattedDate(new Date()));
                var fileObj = file.create({
                    name: 'Error_Fonteva_Journal_Entry_Creation_' + new Date() + '.csv',
                    fileType: file.Type.CSV,
                    contents: errorFileContent
                });

                fileObj.folder = errorFolder;///SCRIPTPARAMETER
                var fileId = fileObj.save();

                log.audit({
                    title: 'Id of new file record',
                    details: fileId
                });
                errorLib.Search_ErrorHandlingInterface({
                    id: inteface_error_handling_id,
                    type: "error",
                    body:
                        "Please find attached Error File generated while processing Fonteva Journal Entry.",
                    attachments: [fileObj],
                });
            }

        }

        function journalCreation(journalEntryJSON) {
            try {
                const currentScript = runtime.getCurrentScript();
                const subsidiary = currentScript.getParameter({
                    name: "custscript_ada_fnt_subsidiary",
                });
                log.debug("Subsidiary", subsidiary);
                const transactionsource = currentScript.getParameter({
                    name: "custscript_ada_fnt_transaction_source",
                });
                log.debug("Transaction Source", transactionsource);
                const status = currentScript.getParameter({
                    name: "custscript_ada_status",
                });
                log.debug("status:", status);
                var journalRec = record.create({
                    type: record.Type.JOURNAL_ENTRY,
                    isDynamic: true
                });
                /*journalRec.setValue({
                    fieldId: "memo",
                    value: jounralEntryJSON.memo,//FontevaJE0045
                });*/
                journalRec.setValue({
                    fieldId: "approvalstatus",
                    value: status
                });
                journalRec.setValue({
                    fieldId: "subsidiary",
                    value: subsidiary
                });
                journalRec.setValue({
                    fieldId: "custbody_ada_transaction_source",
                    value: transactionsource
                });
                journalRec.setValue({
                    fieldId: "externalid",
                    value: journalEntryJSON.ExternalID
                });
                journalRec.setValue({
                    fieldId: "custbody_ada_external_transaction",
                    value: journalEntryJSON.ExternalTransaction
                });
                journalRec.setValue({
                    fieldId: "custbody_ada_fonteva_order",
                    value: journalEntryJSON.soInternalId
                });
                var orderDateFormat = getFormattedDate(journalEntryJSON.Date);
                log.audit("Journal Entry order_date_format", orderDateFormat);
                journalRec.setValue({
                    fieldId: "trandate",
                    value: new Date(orderDateFormat)
                });

                const itemNameFilter = [];
                const customerFilter = [];

                const itemCount = journalEntryJSON.journalEntryChildLineDetialsJSON.length;
                log.debug("itemCount:", itemCount);
                journalEntryJSON.journalEntryChildLineDetialsJSON.forEach((element, i) => {
                    if (i === itemCount - 1) {
                        itemNameFilter.push(["name", "is", element.RevRecItem]);
                        if (element.Entity == "Account") {
                            customerFilter.push(["externalid", "is", element.AccountAvalaraCode]);
                            journalEntryJSON.journalEntryChildLineDetialsJSON[i].customerExternalId = element.AccountAvalaraCode;
                        }
                        else if (element.Entity == "Contact") {
                            customerFilter.push(["externalid", "is", element.ContactUUID]);
                            journalEntryJSON.journalEntryChildLineDetialsJSON[i].customerExternalId = element.ContactUUID;
                        }
                        else {
                            log.debug("Entity Not Found in netsuite");
                            journalEntryJSON.journalId = "";
                            journalEntryJSON.errorMessage = "Provided Entity is Not Present in Netsuite";
                            journalEntryJSON.ExternalTransactionId = journalEntryJSON.ExternalTransaction;
                            // return journalEntryJSON; 
                        }
                    } else {
                        itemNameFilter.push(["name", "is", element.RevRecItem]);
                        itemNameFilter.push("OR");
                        if (element.Entity == "Account") {
                            customerFilter.push(["externalid", "is", element.AccountAvalaraCode]);
                            customerFilter.push("OR");
                            journalEntryJSON.journalEntryChildLineDetialsJSON[i].customerExternalId = element.AccountAvalaraCode;
                        }
                        else if (element.Entity == "Contact") {
                            customerFilter.push(["externalid", "is", element.ContactUUID]);
                            customerFilter.push("OR");
                            journalEntryJSON.journalEntryChildLineDetialsJSON[i].customerExternalId = element.ContactUUID;
                        }
                        else {
                            log.debug("Entity Not Found in netsuite");
                            journalEntryJSON.journalId = "";
                            journalEntryJSON.errorMessage = "Provided Entity is Not Present in Netsuite";
                            journalEntryJSON.ExternalTransactionId = journalEntryJSON.ExternalTransaction;
                            //return journalEntryJSON; 
                        }
                    }
                });
                log.debug("itemNameFilter:", itemNameFilter);
                log.debug("itemNameFilter Length:", itemNameFilter.length);
                log.debug("customerFilter:", customerFilter);
                log.debug("customerFilter Length:", customerFilter.length);
                if (itemNameFilter.length > 0 && customerFilter.length > 0) {
                    itemNameFilter.push("AND");
                    itemNameFilter.push(["isinactive", "is", "F"]);

                    customerFilter.push("AND");
                    customerFilter.push(["isinactive", "is", "F"]);
                    log.debug("Item Filter Array", itemNameFilter);
                    log.debug("Custmer Filter Array", customerFilter);
                    journalEntryJSON.journalEntryChildLineDetialsJSON = searchItem(itemNameFilter, journalEntryJSON.journalEntryChildLineDetialsJSON);
                    journalEntryJSON.journalEntryChildLineDetialsJSON = customerSrch(customerFilter, journalEntryJSON.journalEntryChildLineDetialsJSON);
                    log.debug("journalEntryJSON in Journal Entry creation function", journalEntryJSON);
                    for (var j = 0; j < journalEntryJSON.journalEntryChildLineDetialsJSON.length; j++) {
                        log.debug("item For loop entered");
                        jeSublistDetails = journalEntryJSON.journalEntryChildLineDetialsJSON[j];
                        journalRec.selectNewLine({
                            sublistId: 'line',
                        });
                        if (jeSublistDetails.hasOwnProperty('customerId')) {
                            journalRec.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'entity',
                                value: jeSublistDetails.customerId
                            });
                        }
                        else {
                            log.debug("Customer Not Found in netsuite");
                            journalEntryJSON.journalId = "";
                            journalEntryJSON.errorMessage = "Provided Customer Id is Not Present in Netsuite";
                            journalEntryJSON.ExternalTransactionId = journalEntryJSON.ExternalTransaction;
                            return journalEntryJSON;
                        }
                        log.debug("Sublist Item id:", jeSublistDetails.hasOwnProperty('itemInternalId'));
                        if (jeSublistDetails.hasOwnProperty('itemInternalId')) {
                            journalRec.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'custcol_ada_rev_rec_item',
                                value: jeSublistDetails.itemInternalId
                            });
                        }
                        else {
                            log.debug("Provided Item is Not Present in Netsuite");
                            journalEntryJSON.journalId = "";
                            journalEntryJSON.errorMessage = "Provided Item is Not Present in Netsuite";
                            journalEntryJSON.ExternalTransactionId = journalEntryJSON.ExternalTransaction;
                            return journalEntryJSON;
                        }
                        log.debug("JE sublist Program:", jeSublistDetails.Program);
                        log.debug("JE Sublist Account:", jeSublistDetails.Account);
                        journalRec.setCurrentSublistText({
                            sublistId: 'line',
                            fieldId: 'department',
                            text: jeSublistDetails.Program
                        });
                        journalRec.setCurrentSublistText({
                            sublistId: 'line',
                            fieldId: 'account',
                            text: jeSublistDetails.Account
                        });
                        log.debug("Debit:", jeSublistDetails.Debit);
                        journalRec.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'debit',
                            value: jeSublistDetails.Debit
                        });
                        log.debug("Credit:", jeSublistDetails.Credit);
                        journalRec.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'credit',
                            value: jeSublistDetails.Credit
                        });
                        journalRec.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_ada_external_line_id',
                            value: jeSublistDetails.ExternalLineId
                        });
                        journalRec.commitLine({
                            sublistId: 'line'
                        });


                    }
                    var journalId = journalRec.save();
                    log.debug("journalid:", journalId);
                    journalEntryJSON.journalId = journalId;
                    return journalEntryJSON;
                }
                else {
                    return journalEntryJSON;
                }
            } catch (error) {
                log.error("Error in Create Journal Entry", error);
                journalEntryJSON.journalId = "";
                journalEntryJSON.error = "Error while creating Journal Entry";
                journalEntryJSON.errorMessage = error.message;
            }
            return journalEntryJSON;
        }
        function searchItem(itemFilters, itemdetails) {

            try {
                const itemSearchObj = search.create({
                    type: "item",
                    filters: itemFilters,
                    columns: [
                        { name: "internalid" },
                        search.createColumn({
                            name: "itemid",
                            label: "Name",
                        }),
                    ],
                });
                const results = itemSearchObj.run().getRange({ start: 0, end: 1000 });
                log.debug("Item Filter Array", results);
                if (results.length > 0) {
                    for (var k = 0; k < results.length; k++) {
                        itemdetails.forEach(detail => {
                            if (results[k].getValue({ name: "itemid" }) === detail.RevRecItem) {
                                detail.itemInternalId = results[0].getValue({ name: "internalid" });
                                log.debug("item Id:", detail.itemInternalId);
                            }
                        });
                    }

                }
                return itemdetails;
            } catch (e) {
                log.debug("Error search for item", e);
            }
        }
        function searchSalesOrder(journalEntryJSON) {
            try {
                var transactionSearchObj = search.create({
                    type: "transaction",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters: [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["externalid", "anyof", journalEntryJSON.FontevaOrder],
                        "AND",
                        ["mainline", "is", "T"]
                    ],
                    columns: [search.createColumn({ name: "internalid", label: "Internal ID" })]
                });

                var results = transactionSearchObj.run().getRange({ start: 0, end: 1 });
                log.debug("Results:", results);

                if (results.length > 0) {
                    journalEntryJSON.soInternalId = results[0].getValue({ name: "internalid" });
                }
                else {
                    log.debug("sales order not found", journalEntryJSON.FontevaOrder);
                    log.debug("External Transaction:", journalEntryJSON.ExternalTransaction);
                    journalEntryJSON.soInternalId = "";
                    journalEntryJSON.errorMessage = "Provided Sales Order is missing in Netsuite";
                    journalEntryJSON.ExternalTransactionId = journalEntryJSON.ExternalTransaction;
                }
                return journalEntryJSON;

            } catch (error) {
                log.error("Error in search SalesOrder function", error);
            }
        }

        function customerSrch(custFilter, itemdetails) {
            try {
                log.debug("itemdetails in Customer Search", itemdetails);
                var customerSearchObj = search.create({
                    type: "customer",
                    filters: custFilter,
                    columns: [search.createColumn({ name: "internalid", label: "ID" }),
                    search.createColumn({ name: "externalid", label: "externalid" }),
                    ]
                });

                var results = customerSearchObj.run().getRange({ start: 0, end: 1000 });
                log.debug("Customer Results:", results);

                if (results.length > 0) {
                    for (var i = 0; i < results.length; i++) {
                        itemdetails.forEach(detail => {
                            if (detail.customerExternalId == results[i].getValue("externalid"))
                                detail.customerId = results[i].getValue({ name: "internalid" });
                        });
                    }

                }
                return itemdetails;
            } catch (error) {
                log.error("Error searching for customer:", error);
            }
        }

        function getFormattedDate(date) {
            try {
                var dateFormat = new Date(date);
                var month = (1 + dateFormat.getMonth()).toString();
                var day = dateFormat.getDate().toString();
                var year = dateFormat.getFullYear();
                return month + "/" + day + "/" + year;
            } catch (error) {
                log.error("Error encountered while formatting the order date", error.message);
            }
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });