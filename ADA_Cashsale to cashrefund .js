/*************************************************************************************************************************************
 * Script Name          :   ADA CashRefund MuleSoft Integration
 * Author               :   Vaibhavi Manchala
 * Creation date        :   21st February 2024
 * Company              :   Capgemini India
 * Description          :   This script creates Cash Refund in NS received from MuleSoft
 * Change Log           :   ||    Changed By    ||    Date    ||            Description           ||
                            ||   Rama Sudhakar  || 24-05-2024||Implemented the functionality to create a standalone cash refund ||
 *************************************************************************************************************************************/

/**
 * RestLet to create a Cash refund Record
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define([
    "N/search",
    "N/record",
    "N/runtime",
    "./lib/Error Handling Library.js", "./lib/ADA reusable Functions.js",
    "./lib/ADA Creating Customer and Customer Search.js"
  ], function (search, record, runtime, errorLib, paymentOps, customers) {
    function doPost(requestBody) {
        log.debug("Post Request Received", requestBody);
        // Initialising setup variables
        const script = runtime.getCurrentScript();
        var customer_form= script.getParameter({
            name: "custscript_ada_customer_form"
        });
        log.debug("customer_form",customer_form);
        var customer_category= script.getParameter({
            name: "custscript_ada_customer_category"
        });
        log.debug("customer_category",customer_category);
        var customer_subsidiary= script.getParameter({
            name: "custscript_ada_customer_subsidiary"
        });
        log.debug("customer_subsidiary",customer_subsidiary);
        var customer_isperson= script.getParameter({
            name: "custscript_ada_customer_isperson_cr"
        });
        log.debug("customer_isperson",customer_isperson);
        var customer_status = script.getParameter({
            name: "custscript_ada_customer_status_cr"
        });
        log.debug("customer_status",customer_status);
        let configs = {
            tax_item: script.getParameter({
                name: "custscript_ada_cr_order_tax_item",
            }),
            int_error_id: script.getParameter({
                name: "custscript_ada_cash_ref_intf_err_hndlng",
            }),
            
            res: {
                timeStamp: new Date(),
                crCreated: false,
                txnStatus: `FAILED`,
                message: String,
                cashRefundDocumentNumber: Number,
            },
            receivedJSON: requestBody
            
        };
        requestBody.messageContent.form = customer_form,
        requestBody.messageContent.subsidiary= customer_subsidiary,
        requestBody.messageContent.category= customer_category,
        requestBody.messageContent.status=customer_status,
        requestBody.messageContent.isperson=customer_isperson,
        
        log.debug("Configs", JSON.stringify(configs));
        try {
            const action = requestBody.messageHeader.action;
            if (action == undefined) {
                errorLib.Search_ErrorHandlingInterface({
                    id: configs.int_error_id,
                    type: "error",
                    body:
                        "No action received for Cash Refund request from MuleSoft: \n\n" +
                        JSON.stringify(requestBody),
                });
                log.debug("No action on request", action);
                configs.res.message = `No action on request`;
                return configs.res;
            } else if (action == "CreateCashRefund") {
                log.debug("Creating Cash Refund", requestBody);
                return CreateCashRefund(requestBody.messageContent, configs);
            } else {
                errorLib.Search_ErrorHandlingInterface({
                    id: configs.int_error_id,
                    type: "error",
                    body:
                        "Invalid action on received JSON: \n\n" +
                        JSON.stringify(requestBody),
                });
                log.debug("Invalid Action: ", action);
                configs.res.message = `Invalid action on received JSON ${action}`;
                return configs.res;
            }
        } catch (e) {
            errorLib.Search_ErrorHandlingInterface({
                id: configs.int_error_id,
                type: "error",
                body:
                    "Invalid action on received JSON: \n\n" + JSON.stringify(requestBody),
            });
            log.error("Error message", e);
            configs.res.message = `${e.message}`;
            configs.res.crCreated = false;
            configs.res.txnStatus = "FAILED";
            return configs.res;
        }
    }
    function CreateCashRefund(data, configs) {
        try{        
            const removeLines = [];
            if (data.externalPaymentUUID) {
                var csSearchObj = search.create({
                    type: "cashsale",
                    filters: [
                        ["externalid", "anyof", data.externalPaymentUUID],
                        "AND",
                        ["type", "anyof", "CashSale"],
                        "AND",
                        ["mainline", "is", "T"],
                    ],
                    columns: [
                        search.createColumn({
                            name: 'internalid', label: "Internal ID"
                        })
                    ],
                });
                let crSearchCount = csSearchObj.runPaged().count;
                log.audit(`Search Result count`, crSearchCount);
                if (crSearchCount === 1) {
                    
                        let csId = csSearchObj.run().getRange({
                            start: 0,
                            end: crSearchCount,
                        })[0].id;
                        log.audit(`Parent CS ${data.externalPaymentUUID}`, csId);
                        // Transforming Cash Sale to Cash Refund
                        const cashRefundRecord = record.transform({
                            fromType: record.Type.CASH_SALE,
                            fromId: csId,
                            toType: record.Type.CASH_REFUND,
                            isDynamic: true,
                        });
                        cashRefundRecord.setValue({
                            fieldId: "externalid",
                            value: data.externalRefundUUID,
                        });
                        cashRefundRecord.setValue({
                            fieldId: "custbody_ada_external_transaction",
                            value: data.externalRefundNumber,
                        });
                        var refundMethodId = paymentOps.getRefundMethodId(data.paymentOption);
                        log.debug("refundMethodId", refundMethodId);
                        cashRefundRecord.setValue({
                            fieldId: "paymentoption",
                            value: refundMethodId,
                        });
                        cashRefundRecord.setValue({
                            fieldId: "trandate",
                            value: new Date(data.refundDate),
                        });
                        cashRefundRecord.setValue({
                            fieldId: "custbody_ada_last_4_digits_card",
                            value: data.lastFourDigit,
                        });
                        cashRefundRecord.setValue({
                            fieldId: "custbody_ada_card_type",
                            value: data.cardType,
                        })
                        cashRefundRecord.setValue({
                            fieldId: "custbody_ada_stripe_reference_number",
                            value: data.stripeRefNumber,
                        });
                        cashRefundRecord.setValue({
                            fieldId: "shippingcost",
                            value: data.shippingCost,
                        });
                        if(data.shippingMethod)
                        {
                            cashRefundRecord.setValue({
                                fieldId: "shipmethod",
                                value: data.shippingMethod,
                                ignoreFieldChange: true
                            });
                        }
                    
                        cashRefundRecord.setValue({
                            fieldId: "custbody_ada_shipping_tax_amount",
                            value: data.shippingTaxAmount,
                        });
                        cashRefundRecord.setValue({
                            fieldId: "taxtotal",
                            value: data.totalTax
                        });
                        // Selecting Valid Lines on Cash Refund received in JSON
                        let itemSublistCount = cashRefundRecord.getLineCount({
                            sublistId: "item",
                        });
                        log.audit("Item Count", itemSublistCount);
                        var removeMarketingInsertLines = [];
                        for (let i = 0; i < itemSublistCount; i++) {
                            cashRefundRecord.selectLine({
                                sublistId: "item",
                                line: i,
                            });
                            let lineNumber = cashRefundRecord.getCurrentSublistValue({
                                sublistId: "item",
                                fieldId: "custcol_ada_external_line_id",
                            });
                            const item = cashRefundRecord.getCurrentSublistValue({
                                sublistId: "item",
                                fieldId: "item",
                            });
                            if (lineNumber) {
                                log.debug("lineNumber Not Empty", lineNumber);
                                const index = data.itemDetails.findIndex(
                                    (item) => item.externalLineId == lineNumber
                                );
                                log.debug("index", index);
    
                                if (index == -1) {
                                    if (item != configs.tax_item) {
                                        // Adding unwanted items remove line array
                                        log.debug("Item added to Remove", item)
                                        log.debug("configs.tax_item", configs.tax_item)
                                        removeLines.push(lineNumber);
                                    }
                                    // index = lineNumber;
                                }
                                else {
                                    const quantity = data.itemDetails[index].quantity;
                                    const unitDiscount = data.itemDetails[index].unitDiscount;
                                    const unitPrice = data.itemDetails[index].unitPrice;
                                    const rate = data.itemDetails[index].rate;
                                    const amount = data.itemDetails[index].amount;
                                    const itemTaxAmount = data.itemDetails[index].itemTaxAmount;
                                    cashRefundRecord.setCurrentSublistValue({
                                        sublistId: "item",
                                        fieldId: "quantity",
                                        value: quantity,
                                    });
                                    cashRefundRecord.setCurrentSublistValue({
                                        sublistId: "item",
                                        fieldId: "rate",
                                        value: rate,
                                    });
                                    cashRefundRecord.setCurrentSublistValue({
                                        sublistId: "item",
                                        fieldId: "amount",
                                        value: amount,
                                    });
                                    cashRefundRecord.setCurrentSublistValue({
                                        sublistId: "item",
                                        fieldId: "custcol_ada_unit_discount",
                                        value: unitDiscount,
                                    });
                                    cashRefundRecord.setCurrentSublistValue({
                                        sublistId: "item",
                                        fieldId: "custcol_ada_tax_amount",
                                        value: itemTaxAmount,
                                    });
                                    cashRefundRecord.setCurrentSublistValue({
                                        sublistId: "item",
                                        fieldId: "custcol_ada_unit_price",
                                        value: unitPrice,
                                    });
                                    cashRefundRecord.commitLine({
                                        sublistId: "item",
                                    });
                                }
                            }
    
                            else {
                                if (item != configs.tax_item) {
                                    // Adding unwanted items remove line array
                                    log.debug("Item added to Remove", item)
                                    log.debug("configs.tax_item", configs.tax_item)
                                    var cashRefundAmount = cashRefundRecord.getCurrentSublistValue({
                                        sublistId: "item",
                                        fieldId: "amount"
                                    });
    
                                    if(!cashRefundAmount)
                                    {
                                    log.debug("cashRefundAmount",cashRefundAmount);
                                    removeMarketingInsertLines.push(item);
                                    }
                                }
                                else {
                                    log.debug("else part")
                                    cashRefundRecord.setCurrentSublistValue({
                                        sublistId: "item",
                                        fieldId: "item",
                                        value: configs.tax_item,
                                    });
                                    cashRefundRecord.setCurrentSublistValue({
                                        sublistId: "item",
                                        fieldId: "quantity",
                                        value: 1,
                                    });
    
                                    var tax_rate=cashRefundRecord.setCurrentSublistValue({
                                        sublistId: "item",
                                        fieldId: "rate",
                                        value: data.totalTax,
                                    });
                                    log.debug("tax_rate", tax_rate);
                                    var tax_amount=cashRefundRecord.setCurrentSublistValue({
                                        sublistId: "item",
                                        fieldId: "amount",
                                        value: data.totalTax,
                                    });
                                    log.debug("tax_amount",tax_amount);
                                    cashRefundRecord.commitLine({
                                        sublistId: "item",
                                    });
                                }
                            }
                        } 
                        // Checking if Tax item is present, if not adding it with proper tax amount
                        log.audit("Remove Lines: ", removeLines);
                        // Removing all unwanted lines from Cash Refund
                        removeLines.forEach((line) => {
                            log.debug("External Line Id of Cash Sale to be Removed", line);
                            var lineIndex = cashRefundRecord.findSublistLineWithValue({
                                sublistId: "item",
                                fieldId: "custcol_ada_external_line_id",
                                value: line,
                            });
                            log.debug("Remove  Line Index", lineIndex);
                            cashRefundRecord.removeLine({
                                sublistId: "item",
                                line: lineIndex,
                                ignoreRecalc: false,
                            })
                        }
                        );
                        removeMarketingInsertLines.forEach((line) => {
                            log.debug("External Line Id of Cash Sale to be Removed", line);
                            var lineIndex = cashRefundRecord.findSublistLineWithValue({
                            sublistId: "item",
                            fieldId: "item",
                            value: line,
                            });
                            log.debug("Remove  Line Index", lineIndex);
                            cashRefundRecord.removeLine({
                            sublistId: "item",
                            line: lineIndex,
                            ignoreRecalc: false,
                            })
                        }
                        );
                        
                        // Checking if cash Refund has any line items except tax item
                        let itemCount = cashRefundRecord.getLineCount({
                            sublistId: "item",
                        });
                        log.audit("Items on Cash Refund Before Saving Record", itemCount);
                        // if (itemCount < 2) {
                        //     throw {
                        //         message:
                        //             "Invalid or No items present on Cash Refund:\n" +
                        //             JSON.stringify(data.itemDetails),
                        //     };
                        // }
                        log.debug(
                            "Items on received Before Saving Record",
                            data.itemDetails.length
                        );
                        // if (itemCount <= data.itemDetails.length) {
                        //     throw {
                        //         message:
                        //             "Invalid Item JSON received:\n" + JSON.stringify(data.itemDetails.items),
                        //     };
                        // }
    
                        const cashRefundRecordId = cashRefundRecord.save();
                        log.debug("Cash refund Id", cashRefundRecordId);
                        configs.res.message = "Cash Refund Successfully created in NS";
                        configs.res.crCreated = true;
                        configs.res.txnStatus = "SUCCESS";
                        configs.res.cashRefundDocumentNumber = search.lookupFields({
                            type: search.Type.CASH_REFUND,
                            id: cashRefundRecordId,
                            columns: ["tranid"],
                        }).tranid;
                    
                    
                }
                else {
                    // Call customer search function.
                    let customerSerachJSON = customers.customerSrch(data.amsCustomerId, data);
                    let customerId = customerSerachJSON.customer_internalId;
                    log.debug("CustomerId:", customerId);  
                    if (customerId != "") {
                        // Create cash refund if customer exists
                        return createStandAloneCashRefund(data, configs, customerId);
                    }
                    else
                    {
                        log.error("Error while creating Customer for Standalone Cash Refund", customerSerachJSON.ErrorMessage);
                        configs.res.message = `Error Message: ${customerSerachJSON.Error +" : "+customerSerachJSON.ErrorMessage}`;
                        configs.res.crCreated = false;
                        configs.res.txnStatus = "FAILED";
                        errorLib.Search_ErrorHandlingInterface({
                            id: configs.int_error_id,
                            type: "error",
                            body: `${configs.res.message} \n\nReceived JSON:` + JSON.stringify(data),
                        });
                    }
                }
                
            }
            else {
                // Call customer search function.
                let customerSerachJSON = customers.customerSrch(data.amsCustomerId, data);
                let customerId = customerSerachJSON.customer_internalId;
                log.debug("CustomerId:", customerId);
    
                if (customerId != "") {
                    // Create cash refund if customer exists
                    return createStandAloneCashRefund(data, configs, customerId);
                }
                else{
                    log.error("Error while creating Customer for Standalone Cash Refund", customerSerachJSON.ErrorMessage);
                    configs.res.message = `Error Message: ${customerSerachJSON.Error +" : "+customerSerachJSON.ErrorMessage}`;
                    configs.res.crCreated = false;
                    configs.res.txnStatus = "FAILED";
                    errorLib.Search_ErrorHandlingInterface({
                        id: configs.int_error_id,
                        type: "error",
                        body: `${configs.res.message} \n\nReceived JSON:` + JSON.stringify(data),
                    });          
                     
                }

            }
            return configs.res;
        }
        catch(error)   
        {
            log.debug("Error encountered while creating Cash Refund", error);
            configs.res.message = `${error.message}`;
            configs.res.crCreated = false;
            configs.res.txnStatus = "FAILED";
            errorLib.Search_ErrorHandlingInterface({
                    id: configs.int_error_id,
                    type: "error",
                    body:
                        `${error.message} \n\nReceived JSON:` +
                        JSON.stringify(configs.receivedJSON),
            });
            
        } 
    }
    function createStandAloneCashRefund(data, configs, customerId) {
        log.debug("customerId:", customerId);
        log.debug("Body: ", JSON.stringify(data));
        try {
            // Create cash refund record
            var cashRefundRecord = record.create({
                type: record.Type.CASH_REFUND,
                isDynamic: true,
            });
            cashRefundRecord.setValue({
                fieldId: "entity",
                value: customerId,
            });
            cashRefundRecord.setValue({
                fieldId: "externalid",
                value: data.externalRefundUUID,
            });
            cashRefundRecord.setValue({
                fieldId: "custbody_ada_external_transaction",
                value: data.externalRefundNumber,
            });
  
            var refundMethodId = paymentOps.getRefundMethodId(data.paymentOption);
            log.debug("refundMethodId", refundMethodId);
  
            cashRefundRecord.setValue({
                fieldId: "paymentoption",
                value: refundMethodId,
            });
  
            cashRefundRecord.setValue({
                fieldId: "trandate",
                value: new Date(data.refundDate),
            });
            cashRefundRecord.setValue({
                fieldId: "taxtotal",
                value: data.totalTax
            });
  
            cashRefundRecord.setValue({
                fieldId: "custbody_ada_last_4_digits_card",
                value: data.lastFourDigit,
            });
  
            cashRefundRecord.setValue({
                fieldId: "custbody_ada_card_type",
                value: data.cardType,
            });
  
            cashRefundRecord.setValue({
                fieldId: "custbody_ada_stripe_reference_number",
                value: data.stripeRefNumber,
            });
  
            cashRefundRecord.setValue({
                fieldId: "shippingcost",
                value: data.shippingCost,
            });
            log.debug("Shipping Method:", data.shippingMethod);
            cashRefundRecord.setValue({
                fieldId: "shipmethod",
                value: data.shippingMethod,
                ignoreFieldChange: true
            });
  
            cashRefundRecord.setValue({
                fieldId: "custbody_ada_shipping_tax_amount",
                value: data.shippingTaxAmount,
            });
  
            // Selecting Valid Lines on Cash Refund received in JSON
            const itemNameFilter = [];
            const itemCount = data.itemDetails.length;
            data.itemDetails.forEach((element, i) => {
                if (i === itemCount - 1) {
                    itemNameFilter.push(["name", "contains", element.name]);
                } else {
                    itemNameFilter.push(["name", "contains", element.name]);
                    itemNameFilter.push("OR");
                }
            });
            itemNameFilter.push("AND");
            itemNameFilter.push(["isinactive","is","F"]);
            itemNameFilter.push("AND");
            itemNameFilter.push(["formulanumeric: CASE WHEN UPPER({name}) = {name} THEN 1 ELSE 0 END","equalto","1"]);
            log.debug("Item Filter Array", itemNameFilter);
            const itemSearchObj = search.create({
                type: "item",
                filters: itemNameFilter,
                columns: [
                    { name: "internalid" },
                    search.createColumn({
                        name: "itemid",
                        label: "Name",
                    }),
                ],
            });
  
            const itemSearchCount = itemSearchObj.runPaged().count;
            log.audit(`Search Result count`, itemSearchCount);
            if (itemSearchCount === 0) {
                throw new Error("Item not Found, Product not present in NetSuite.");
            }
            itemSearchObj.run().each(function (result) {
                let itemId = result.getValue("itemid");
                log.debug('ItemId:', itemId);
                let foundItems = data.itemDetails.filter((item) => item.name === itemId);
                if (foundItems.length > 0) {
                    foundItems.forEach((item) => {
                        var item_id = item.nsInternalId = result.getValue("internalid");
                        log.debug("Item Id:", item_id);
                    });
                } else {
                    log.audit(`Item ${itemId} not found!!!`);
                }
                return true;
            });
  
            log.audit(`Item obj:`, data.itemDetails);
            let SublistItems = data.itemDetails.length;
            log.debug("Sublist Items Count:", SublistItems);
            for (let i = 0; i < SublistItems; i++) {
                cashRefundRecord.selectNewLine({
                    sublistId: "item",
                });
  
                // Setting sublist values and calculating total tax amount on Cash Sale
                const itemDetail = data.itemDetails[i];
                cashRefundRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                    value: itemDetail.nsInternalId,
                });
                cashRefundRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_ada_external_line_id",
                    value: itemDetail.externalLineId,
                });
                cashRefundRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "quantity",
                    value: itemDetail.quantity,
                });
                cashRefundRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "rate",
                    value: itemDetail.rate,
                });
                cashRefundRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "amount",
                    value: itemDetail.amount,
                });
                cashRefundRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_ada_unit_discount",
                    value: itemDetail.unitDiscount,
                });
                cashRefundRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_ada_tax_amount",
                    value: itemDetail.itemTaxAmount,
                });
                cashRefundRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_ada_unit_price",
                    value: itemDetail.unitPrice,
                });
                cashRefundRecord.commitLine({
                    sublistId: "item",
                });
            }
            if (data.totalTax > 0) {
                log.debug("tax item", configs.tax_item);
                //Adding tax item Line
                cashRefundRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                    value: configs.tax_item,
                });
                cashRefundRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "quantity",
                    value: 1,
                });
                log.debug("taxamoutn", data.totalTax);
                cashRefundRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "rate",
                    value: data.totalTax,
                });
                cashRefundRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "amount",
                    value: data.totalTax,
                });
                cashRefundRecord.commitLine({
                    sublistId: "item",
                });
            }
  
            // Save cash refund record
            const cashRefundRecordId = cashRefundRecord.save();
            log.debug("Cash Refund Id", cashRefundRecordId);
            // Update response object
            configs.res.message = "Standalone Cash Refund has been successfully created in NS.";
            configs.res.crCreated = true;
            configs.res.txnStatus = "SUCCESS";
            configs.res.cashRefundDocumentNumber = search.lookupFields({
                type: search.Type.CASH_REFUND,
                id: cashRefundRecordId,
                columns: ["tranid"],
            }).tranid;
  
        } catch (error) {
            log.error("Error encountered while creating Standalone Cash Refund:", error);
            configs.res.message = `${error.message}`;
            configs.res.crCreated = false;
            configs.res.txnStatus = "FAILED";
            errorLib.Search_ErrorHandlingInterface({
                id: configs.int_error_id,
                type: "error",
                body: `${error.message} \n\nReceived JSON:` + JSON.stringify(data),
            });
        }
        return configs.res;
    }
    return {
        post: doPost,
    };
  });