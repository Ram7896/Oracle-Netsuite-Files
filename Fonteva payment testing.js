/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/file', 'N/search', 'N/log', 'N/record', "N/runtime"],
    function (file, search, log, record, runtime) {

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
                /* var scriptObj = runtime.getCurrentScript();
                 var processedFolder = scriptObj.getParameter({ name: "custscript_ada_processed_folder_id" });
                 var fileName = fileObj.name;
 
                 var newFile = file.create({
                     name: fileName,
                     fileType: file.Type.CSV,
                     contents: fileContents,
                     folder: processedFolder
                 });
                 var newFileID = newFile.save();
                 log.debug("New file created and saved with ID:", newFileID);
 
                /* file.delete({
                     id: fileId.id
                 });
                 log.debug("file has been deleted");*/

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
                    "StripeReferenceNumber": cells[6].replace(/[^\d.]/g, ''),
                    "Check": cells[7].replace(/[^\d.]/g, ''),
                    "Last4DigitsCard": cells[8].replace(/[^\d.]/g, ''),
                    "CardType": cells[9],
                    "PaymentAmount": cells[10].replace(/[^\d.]/g, ''),
                }

            }
            log.debug("SalesOrderPaymentJSON:", salesorderPaymentJSON);
            var soJSON = searchSalesOrder(salesorderPaymentJSON);
            log.debug("SalesOrderPaymentJSON:", salesorderPaymentJSON);

            if (soJSON.soInternalId) {
                if (salesorderPaymentJSON.PostingEntity == "Invoice") {
                    if (soJSON.applyingTransactionInternalId) {
                        // Create Payment record only
                        salesorderPaymentJSON = createCustomerPayment(salesorderPaymentJSON);
                        log.debug("Script will create Payment from Invoice .", soJSON.applyingTransactionInternalId);
                    }
                    else {
                        // Create Invoice
                        salesorderPaymentJSON = createInvoice(salesorderPaymentJSON);
                        //Create payment
                        log.debug("Script will create Invoice and Payment from Sales Order.");
                    }

                }
                else if (salesorderPaymentJSON.PostingEntity == "Receipt") {

                    if (soJSON.applyingTransactionInternalId) {
                        //Throw error        
                        log.debug("Cash Sale is already present");
                    }
                    else {
                        //Create Cash Sale
                        log.debug("Script will create Cash Sale from Sales Order.");
                    }
                }
                log.debug("Final salesorderPaymentJSON", salesorderPaymentJSON);
            }
            else {
                log.debug("Sales Order in not present in Netsuite");
            }

        }

        function summarize(context) {
            log.audit({
                title: 'Final Output',
                details: context
            });
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
                return salesorderPaymentJSON;

            }
            catch (error) {
                log.error("Error in create invoice", error.error);
            }

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
                paymentRecord.setText("paymentoption", salesorderPaymentJSON.PaymentOption);
                paymentRecord.setValue("custbody_ada_stripe_reference_number", salesorderPaymentJSON.StripeReferenceNumber);
                paymentRecord.setValue("custbody_ada_last_4_digits_card", salesorderPaymentJSON.Last4DigitsCard);
                paymentRecord.setValue("custbody_ada_card_type", salesorderPaymentJSON.CardType);
                paymentRecord.setValue("custbody_ada_card_type", salesorderPaymentJSON.CardType);

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
            }
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