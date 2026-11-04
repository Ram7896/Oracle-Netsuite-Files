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
    "./lib/ADA reusable Functions.js",
], function (search, record, runtime, paymentOps) {
    function doPost(requestBody) {
        let res = { success: true, message: "" };

        try {
            log.debug("Post Request Received", requestBody);

            // Initialising setup variables
            const script = runtime.getCurrentScript();
            let configs = {
                tax_item: script.getParameter({ name: "custscriptcustscript_ada_cs_order_tax_it" })
            };
            log.debug("Configs", JSON.stringify(configs));

            let data = requestBody;
            let amsCustomerId = data.amsCustomerId;

            // Call customer search function
            let customerId = customerSrch(amsCustomerId);

            if (customerId) {
                // create cash refund if customer exists
                res = StandAloneCashRefund(data, configs);
            } else {
                // Customer is not there, create customer and create standalone cash sale
                const customerRec = record.create({
                    type: record.Type.CUSTOMER,
                });
                customerRec.setValue({
                    fieldId: "subsidiary",
                    value: data.customer_subsidiary,
                });
                customerRec.setValue({
                    fieldId: "isperson",
                    value: "T",
                });
                customerRec.setValue({
                    fieldId: "firstname",
                    value: data.firstName,
                });
                customerRec.setValue({
                    fieldId: "lastname",
                    value: data.lastName,
                });
                customerRec.setValue({
                    fieldId: "email",
                    value: data.userEmail,
                });
                customerRec.setValue({
                    fieldId: "custentity_ada_customer_status",
                    value: 2,
                });
                customerRec.setValue({
                    fieldId: "custentity_ada_ams_customer_id",
                    value: data.amsCustomerId,
                });
                customerId = customerRec.save();
                res.customerId = customerId;
                res.createdCustomer = true;

                log.debug(`Customer: ${customerId}`);
                res = StandAloneCashRefund(data, configs);
            }
        } catch (error) {
            log.debug("Error encountered in doPost function", error);
            res.success = false;
            res.message = `Error in doPost function: ${error.message}`;
        }

        return res;
    }

    function StandAloneCashRefund(data, configs) {
        let res = { success: true, message: "" };
        let removeLines = [];
        try {
            log.debug("Body: ", JSON.stringify(data));
            // Setup values
            var cashRefundRecord = record.create({
                type: record.Type.CASH_REFUND,
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
            });

            cashRefundRecord.setValue({
                fieldId: "custbody_ada_stripe_reference_number",
                value: data.stripeRefNumber,
            });

            cashRefundRecord.setValue({
                fieldId: "shippingcost",
                value: data.shippingCost,
            });

            cashRefundRecord.setValue({
                fieldId: "custbody_ada_shipping_tax_amount",
                value: data.shippingTaxAmount,
            });

            // Selecting Valid Lines on Cash Refund received in JSON
            let itemSublistCount = cashRefundRecord.getLineCount({
                sublistId: "item",
            });

            log.audit("Item Count", itemSublistCount);

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
                    if (index === -1) {
                        if (item != configs.tax_item) {
                            // Adding unwanted items remove line array
                            log.debug("Item added to Remove", item);
                            log.debug("configs.tax_item", configs.tax_item);
                            removeLines.push(lineNumber);
                        }
                    } else {
                        // Setting sublist values and calculating total tax amount on Cash Sale
                        const quantity = data.itemDetails[index].quantity;
                        const taxOnLine = data.itemDetails[index].itemTaxAmount;
                        const rate = data.itemDetails[index].rate;
                        const amount = data.itemDetails[index].amount;
                        const unitDiscount = data.itemDetails[index].unitDiscount;
                        const unitPrice = data.itemDetails[index].unitPrice;

                        log.debug("Quantity: ", quantity);
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
                            value: taxOnLine,
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
            }
            // Removing all unwanted lines from Cash Refund
            removeLines.forEach((line) => {
                log.debug("External Line Id of Cash Sale to be Removed", line);
                var lineIndex = cashRefundRecord.findSublistLineWithValue({
                    sublistId: "item",
                    fieldId: "custcol_ada_external_line_id",
                    value: line,
                });
                log.debug("Remove Line Line Index", lineIndex);
                cashRefundRecord.removeLine({
                    sublistId: "item",
                    line: lineIndex,
                    ignoreRecalc: false,
                });
            });
            // Checking if cash Refund has any line items except tax item
            let itemCount = cashRefundRecord.getLineCount({
                sublistId: "item",
            });
            log.audit("Items on Cash Refund Before Saving Record", itemCount);
            if (itemCount <= data.itemDetails.length) {
                throw new Error("Invalid Item JSON received:\n" + JSON.stringify(data.itemDetails));
            }
            const cashRefundRecordId = cashRefundRecord.save();
            log.debug("Cash Sale Id", cashRefundRecordId);
            res.cashRefundRecordId = cashRefundRecordId;
        } catch (error) {
            log.debug("Error encountered while creating Cash Refund", error);
            res.success = false;
            res.message = `Error in StandAloneCashRefund function: ${error.message}`;
        }

        return res;
    }

    // Function to create Customer Search
    function customerSrch(amsCustomerId) {
        try {
            var customerSearchObj = search.create({
                type: "customer",
                filters: [
                    ["custentity_ada_ams_customer_id", "is", amsCustomerId],
                    "AND",
                    ["isinactive", "is", "F"],
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        label: "ID",
                    }),
                ],
            });
            let count = customerSearchObj.runPaged().count;
            if (count === 0) {
                return undefined;
            }
            var result = customerSearchObj.run().getRange(0, 2);
            var customer_internalId = result[0].getValue({
                name: "internalid",
            });
            log.debug("customer_internalId", customer_internalId);

            return customer_internalId;
        } catch (error) {
            log.error("Error in customerSrch function", error);
            return undefined;
        }
    }

    return {
        post: doPost,
    };
});