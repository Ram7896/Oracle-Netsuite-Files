/*************************************************************************************************************************************
 * Script Name         :   Fonteva Sales Order Payment Creation
 * Author              :   Rama Sudhakar
 * Creation date       :   26th June 2024
 * Company             :   Capgemini India
 * Description         :   This script creates sales order payment records by searching for the sales order ID. If found, it checks the Posting Entity. For an invoice, it creates an invoice and payment record, or just a payment if the invoice exists. For a receipt, it updates the sales order and creates a cash sale record.
 * Change Log            :   ||    Changed By         ||    Date        ||            Description    
 ********************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/file', 'N/search', 'N/log', 'N/record', "N/runtime","./lib/Error Handling Library.js" ],
    function (file, search, log, record, runtime,errorLib) {

        function getInputData() {
            try {
                const currentscriptpara = runtime.getCurrentScript();
                var paymentFolderId = currentscriptpara.getParameter({
                    name: "custscript_ada_payment_folder_id",
                });
                log.debug("folderId is", paymentFolderId);
                var fileSearch = search.create({
                    type: "file",
                    filters: [
                        ["folder", "anyof", paymentFolderId]
                    ],
                    columns: ['internalid']
                });

                var fileSearchResult = fileSearch.run().getRange({
                    start: 0,
                    end: 1000
                });
                return fileSearchResult;


            } catch (e) {
                log.error({
                    title: 'Error in getinputdata',
                    details: e
                });
            }
        }

        function map(context) {
            try {
                //log.debug("Context:", context);
                var fileId = JSON.parse(context.value);
                log.debug("FIle Id:", fileId);
                var file_internalid = fileId.id;
                var fileObj = file.load({
                    id: file_internalid
                });
                var fileContents = fileObj.getContents();
                //log.debug("fileContents:", fileContents);
                var splitcells = fileContents.split('\n');
                //log.debug("split", splitcells);
                //log.audit("split length", splitcells.length);
                for (var i = 1; i < splitcells.length - 1; i++) {
                    var cells = splitcells[i].split(',').map(cell => cell.trim());
                    log.debug("Cells:", cells);
                    context.write({
                        key: cells[2],
                        value: cells
                    });
                }
                 var scriptObj = runtime.getCurrentScript();
                 var processedFolder = scriptObj.getParameter({ name: "custscript_ada_payment_processed" });
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
                     id: fileId.id
                 });
                 log.debug("file has been deleted");

            } catch (e) {
                log.debug("Error in Map:", e);
            }
        }

        function reduce(context) {
            log.debug("context.key", context.values);
            //log.debug("context.value",context.value);
            var salesorderPaymentJSON = {};
            for (var i = 0; i < context.values.length; i++) {
                var cells = JSON.parse(context.values[i]);
                salesorderPaymentJSON = {
                    "PostingEntity": cells[0],
                    "SOExternalid": cells[1],
                    "ExternalPaymentUUID": cells[2],
                    "ExternalPaymentTransactionId": cells[3],
                    "TransactionDate": cells[4],
                    "PaymentOption": cells[5],
                    "StripeReferenceNumber": cells[6],
                    "Check": cells[7],
                    "Last4DigitsCard": cells[8],
                    "CardType": cells[9],
                    "PaymentAmount": cells[10].replace(/[^\d.]/g, ''),
                }

            }
            log.debug("SalesOrderPaymentJSON:", salesorderPaymentJSON);
            salesorderPaymentJSON = searchSalesOrder(salesorderPaymentJSON);
            log.debug("SalesOrderPaymentJSON after SO Search:", salesorderPaymentJSON);

            if (salesorderPaymentJSON.soInternalId) {
                if (salesorderPaymentJSON.PostingEntity == "Invoice") {
                    if (salesorderPaymentJSON.applyingTransactionInternalId) {
                        // Create Payment record only
                        salesorderPaymentJSON = createCustomerPayment(salesorderPaymentJSON);
                        log.debug("Script will create Payment from Invoice .", salesorderPaymentJSON);
                    }
                    else {
                        // Create Invoice
                        salesorderPaymentJSON = createInvoice(salesorderPaymentJSON);
                        //Create payment
                        log.debug("Script will create Invoice and Payment from Sales Order.");
                    }
                    if(salesorderPaymentJSON.paymentId == "")
                        {
                            context.write({
                                key: salesorderPaymentJSON.ExternalPaymentUUID,
                                value: {
                                    "Error": salesorderPaymentJSON.error,
                                    "ErrorMessage": salesorderPaymentJSON.errorMessage,
                                    "ExternalTransaction": salesorderPaymentJSON.ExternalPaymentTransactionId
                                }
                            })
                        }


                }
                else if (salesorderPaymentJSON.PostingEntity == "Receipt") {

                    if (salesorderPaymentJSON.applyingTransactionInternalId) {
                        //Throw error        
                        log.debug("Cash Sale is already present");
                        salesorderPaymentJSON.cashSaleId = "";
                        salesorderPaymentJSON.error = "Error while creating the Cash Sale"; 
                        salesorderPaymentJSON.errorMessage = "Cash Sale is already present";                                               

                    }
                    else {
                        //Create Cash Sale
                        log.debug("Script will create Cash Sale from Sales Order.");
                        salesorderPaymentJSON = updateSalesOrder(salesorderPaymentJSON);                            

                    }
                    if(salesorderPaymentJSON.cashSaleId == "")
                        {
                            context.write({
                                key: salesorderPaymentJSON.ExternalPaymentUUID,
                                value: {
                                    "Error": salesorderPaymentJSON.error,
                                    "ErrorMessage": salesorderPaymentJSON.errorMessage,
                                    "ExternalTransaction": salesorderPaymentJSON.ExternalPaymentTransactionId
                                }
                            })
                        }
                }
                else{
                    context.write({
                        key: salesorderPaymentJSON.ExternalPaymentUUID,
                        value: {
                            "Error": "Wrong file content",
                            "ErrorMessage": "Privided Posting Entity is incorrect",
                            "ExternalTransaction": salesorderPaymentJSON.ExternalPaymentTransactionId
                        }
                    })
                }
                log.debug("Final salesorderPaymentJSON", salesorderPaymentJSON);
            }
            else {
                log.debug("Sales Order in not present in Netsuite");
                context.write({
                    key: salesorderPaymentJSON.ExternalPaymentUUID,
                    value: {
                        "Error": "Data doesn't exist.",
                        "ErrorMessage": "Provided Sales Order is missing in Netsuite",
                        "ExternalTransaction": salesorderPaymentJSON.ExternalPaymentTransactionId
                    }
                })
            }

        }

        function summarize(context) {
            log.audit({
                title: 'Final Output',
                details: context
            });
            var inteface_error_handling_id = runtime
                .getCurrentScript()
                .getParameter("custscript_ada_fonteva_error_handling");
            log.debug("inteface_error_handling_id", inteface_error_handling_id);

            var errorFolder = runtime.getCurrentScript().getParameter("custscript_ada_payment_error_file_folder");
            log.debug("Error Folder Id", errorFolder);

            var errorFileContent = 'External Id,External Transaction No,Error Code,ErrorMessage \n';
            var noOfRows = 0;
            context.output.iterator().each(function (key, values) {
                noOfRows++;
                var errorCode = JSON.parse(values);
                log.debug("errorCode", errorCode),
                    errorFileContent += (key + ' , ' + errorCode.ExternalTransaction + ',' + errorCode.Error + ',"' + errorCode.ErrorMessage + '" \n');
                return true;
            });
            log.debug("Error File Content data", errorFileContent);
            if (noOfRows > 0) {
                //Creating Error File
                log.debug("Current Date", new Date());
                log.debug("Converted Current Date", getFormattedDate(new Date()));
                var fileObj = file.create({
                    name: 'Error_Fonteva_SO_Payment_Creation_'+new Date()+'.csv',
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
                        "Please find attached Error File generated while processing Fonteva Sales Orders.",
                    attachments: [fileObj],
                });
            }

        }

        function createInvoice(salesorderPaymentJSON) {
            try {
                var invoice = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: salesorderPaymentJSON.soInternalId,
                    toType: record.Type.INVOICE,
                    isDynamic: true,
                });
                invoice.setValue({
                    fieldId: 'custbody_created_by',
                    value: salesorderPaymentJSON.soCreatedBy
                });
                salesorderPaymentJSON.applyingTransactionInternalId = invoice.save();
                log.debug("Inside Invoice Creation Function", salesorderPaymentJSON);
                salesorderPaymentJSON = createCustomerPayment(salesorderPaymentJSON);
                log.debug("salesorderPaymentJSON after creating Payment Record",salesorderPaymentJSON);
                return salesorderPaymentJSON;

            }
            catch (error) {
                log.error("Error in create invoice", error.error);
                salesorderPaymentJSON.paymentId = "";
                salesorderPaymentJSON.error = "Error while creating Invoice Record";
                salesorderPaymentJSON.errorMessage = error.message;
            }
            return salesorderPaymentJSON;
        }

        function createCustomerPayment(salesorderPaymentJSON) {
            try {

                var paymentRecord = record.transform({
                    fromType: 'invoice',
                    fromId: salesorderPaymentJSON.applyingTransactionInternalId,
                    toType: 'customerpayment',
                    //isDynamic: true,
                });
                var order_date_format = getFormattedDate(salesorderPaymentJSON.TransactionDate);
                log.audit("order_date_format", order_date_format);
                paymentRecord.setValue("trandate", new Date(order_date_format));
                paymentRecord.setValue("externalid", salesorderPaymentJSON.ExternalPaymentUUID);
                paymentRecord.setValue("custbody_ada_external_transaction", salesorderPaymentJSON.ExternalPaymentTransactionId);
                paymentRecord.setText({fieldId: "paymentoption",text: salesorderPaymentJSON.PaymentOption});   
             
                paymentRecord.setValue("custbody_ada_stripe_reference_number", salesorderPaymentJSON.StripeReferenceNumber);
                paymentRecord.setValue("custbody_ada_last_4_digits_card", salesorderPaymentJSON.Last4DigitsCard);
                paymentRecord.setValue("custbody_ada_card_type", salesorderPaymentJSON.CardType);
                if(salesorderPaymentJSON.PaymentOption == "Check"){
                    paymentRecord.setValue("checknumber", salesorderPaymentJSON.Check);
                }
                var linecount = paymentRecord.getLineCount({
                    sublistId: 'apply'
                });
                log.debug("Line Count", linecount);
                for (var i = 1; i <= linecount; i++) {
                    var refnum = paymentRecord.getSublistValue({
                        sublistId: 'apply',
                        fieldId: 'internalid',
                        line: i
                    });
                    log.debug("Applying Transaction refnum", refnum);
                    if (refnum == salesorderPaymentJSON.applyingTransactionInternalId) {
                        log.debug("Found Applying Transaction refnum", refnum);

                        paymentRecord.setSublistValue({
                            sublistId: 'apply',
                            fieldId: 'apply',
                            line: i,
                            value: true
                        });

                        paymentRecord.setSublistValue({
                            sublistId: 'apply',
                            fieldId: 'amount',
                            line: i,
                            value: parseFloat(salesorderPaymentJSON.PaymentAmount)
                        });
                    }

                }
                var paymentId = paymentRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug("Payment Id", paymentId);
                salesorderPaymentJSON.paymentId = paymentId;
                return salesorderPaymentJSON;


            }
            catch (error) {
                log.error("Error in Create Customer Payment Function", error);
                salesorderPaymentJSON.paymentId = "";
                salesorderPaymentJSON.error = "Error while creating Payment record";
                salesorderPaymentJSON.errorMessage = error.message;
                log.error("salesorderPaymentJSON in creating payment record", salesorderPaymentJSON);
                return salesorderPaymentJSON;
            }
            
        }

        function updateSalesOrder(salesorderPaymentJSON) {
            try {
                var soRec = record.load({
                    type: record.Type.SALES_ORDER,
                    id: salesorderPaymentJSON.soInternalId,
                });
                log.debug("SO loaded for cashsale:", soRec);
                soRec.setText({
                    fieldId: "paymentoption",
                    text: salesorderPaymentJSON.PaymentOption
                });
                soRec.setValue({
                    fieldId: "custbody_ada_card_type",
                    value: salesorderPaymentJSON.CardType
                });
                soRec.setValue({
                    fieldId: 'custbody_ada_last_4_digits_card',
                    value: salesorderPaymentJSON.Last4DigitsCard
                });
                soRec.setValue({
                    fieldId: "custbody_ada_stripe_reference_number",
                    value: salesorderPaymentJSON.StripeReferenceNumber
                })
                var updatedSoID = soRec.save();
                log.debug("updatedSOID is", updatedSoID);
                salesorderPaymentJSON = transformsalesorderToCashsale(salesorderPaymentJSON)
            } catch (e) {
                log.error('Error loading and updating Sales Order', e);
                salesorderPaymentJSON.cashSaleId = "";
                salesorderPaymentJSON.error = "Error while updating Sales Order before creating Cash Sale";
                salesorderPaymentJSON.errorMessage = e.message;
            }
            return salesorderPaymentJSON;
        }
        function transformsalesorderToCashsale(salesorderPaymentJSON) {
            try {
                const cashSaleRec = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: salesorderPaymentJSON.soInternalId,
                    toType: record.Type.CASH_SALE,
                    isDynamic: true,
                });
                // log.debug("Cash Sale record transformed:", cashSaleRec);
                var order_date_format = getFormattedDate(salesorderPaymentJSON.TransactionDate);
                log.audit(" Cash Sale order_date_format", order_date_format);
                cashSaleRec.setValue({
                    fieldId: "trandate",
                    value: new Date(order_date_format),
                });
                cashSaleRec.setValue({
                    fieldId: "externalid",
                    value: salesorderPaymentJSON.ExternalPaymentUUID,
                });
                log.debug("External Transaction Id",salesorderPaymentJSON.ExternalPaymentTransactionId);
                 cashSaleRec.setValue({
                     fieldId: "custbody_ada_external_transaction",
                     value: salesorderPaymentJSON.ExternalPaymentTransactionId,
                });
                cashSaleRec.setValue({
                    fieldId: "custbody_ada_stripe_reference_number",
                    value: salesorderPaymentJSON.StripeReferenceNumber,
                });
                if(salesorderPaymentJSON.PaymentOption == "Check"){
                    cashSaleRec.setValue("otherrefnum", salesorderPaymentJSON.Check);
                }
                var cashSaleId = cashSaleRec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                salesorderPaymentJSON.cashSaleId = cashSaleId;
                return salesorderPaymentJSON;
            } catch (e) {
                log.error('Error transforming Sales Order to Cash Sale', e);
                salesorderPaymentJSON.cashSaleId = "";
                salesorderPaymentJSON.error = "Error while creating Cash Sale";
                salesorderPaymentJSON.errorMessage = e.message;
            }
            return salesorderPaymentJSON;
        }

        function searchSalesOrder(salesorderPaymentJSON) {
            try {
                var transactionSearchObj = search.create({
                    type: "transaction",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["externalid", "anyof", salesorderPaymentJSON.SOExternalid],
                            "AND",
                            ["shipping", "is", "F"],
                            "AND",
                            ["taxline", "is", "F"],
                            "AND",
                            ["custbody_ada_transaction_source", "anyof", "3"],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["status", "anyof", "SalesOrd:F", "SalesOrd:G"],
                            "AND",
                            ["applyingtransaction.type", "anyof", "@NONE@", "CashSale", "CustInvc"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({
                                name: "internalid",
                                join: "applyingTransaction",
                                label: "Internal ID"
                            }),
                            search.createColumn({ name: "custbody_created_by", label: "Created By" })

                        ]
                });
                var results = transactionSearchObj.run().getRange({ start: 0, end: 1 });
                log.debug("Results:", results);
                if (results.length > 0) {
                    salesorderPaymentJSON.soInternalId = results[0].getValue({ name: "internalid" });
                    salesorderPaymentJSON.applyingTransactionInternalId = results[0].getValue({
                        name: 'internalid',
                        join: 'applyingTransaction'
                    });
                    salesorderPaymentJSON.soCreatedBy = results[0].getValue({ name: "custbody_created_by" });

                }

                return salesorderPaymentJSON;
            }
            catch (error) {
                log.error("Error in search sales order function", error.error);
            }
        }
        //Formatting the date in MM-DD-YYYY
        function getFormattedDate(date) {
            try {
                var date_format = new Date(date);
                var month = (1 + date_format.getMonth()).toString();
                var day = date_format.getDate().toString();
                var year = date_format.getFullYear();
                return month + "/" + day + "/" + year;
            } catch (error) {
                log.error(
                    "Error encoutered while formatting the  order date",
                    error.message
                );
            }
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });