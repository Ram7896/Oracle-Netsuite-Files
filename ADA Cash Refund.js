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
    "./lib/Error Handling Library.js",
    "./lib/ADA reusable Functions.js"
], function (search, record, runtime, errorLib, paymentOps) {

    function doPost(requestBody) {
        log.debug("Post Request Received", requestBody);

        const script = runtime.getCurrentScript();
        let configs = {
            tax_item: script.getParameter({ name: "custscript_ada_cs_order_tax_it" }),
            int_error_id: script.getParameter({ name: "custscript_ada_cash_sale_intf_err_hnd" }),
            res: {} // Initialize response object
        };
        log.debug("Configs", JSON.stringify(configs));

        const action = requestBody.messageHeader.action;
        const data = requestBody.messageContent;

        if (action == "Customers") {
            log.debug("Creating Cash Refund", requestBody);
            return Customers(data, configs);
        }
    }

    function Customers(data, configs) {
        let amsCustomerId = data.amsCustomerId;

        // Call customer search function.
        let customerId = customerSrch(amsCustomerId, data, configs);
        log.debug("CustomerId:", customerId);

        if (customerId) {
            // Create cash refund if customer exists
            return createStandAloneCashRefund(data, configs, customerId);
        } 
    }
    function createCustomer(data, configs) {
        try {
            const customerRec = record.create({
                type: record.Type.CUSTOMER,
            });
            customerRec.setValue({
                fieldId: "subsidiary",
                value: "2",
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
                fieldId: "custentity_ada_ams_customer_id",
                value: data.amsCustomerId,
            });

            let customerId = customerRec.save();
            log.debug(`Customer created: ${customerId}`);
            configs.res.customerId = customerId;
            configs.res.createdCustomer = true;
           return customerId;
           // return createStandAloneCashRefund(data, configs, customerId);

        } catch (error) {
            log.error("Error creating customer:", error);
            configs.res.message = `Error creating customer: ${error.message}`;
            return null;
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
            log.debug("Shipping Method:", data.shipmethod);
            cashRefundRecord.setValue({
                fieldId: "shipmethod",
                value: data.shipmethod,
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
            // Save cash refund record
            const cashRefundRecordId = cashRefundRecord.save();
            log.debug("Cash Refund Id", cashRefundRecordId);
            // Update response object
            configs.res.message = "Cash Refund Standalone Successfully created in NS";
            configs.res.crCreated = true;
            configs.res.txnStatus = "SUCCESS";
            configs.res.cashRefundDocumentNumber = search.lookupFields({
                type: search.Type.CASH_REFUND,
                id: cashRefundRecordId,
                columns: ["tranid"],
            }).tranid;

            return configs.res;
        } catch (error) {
            log.error("Error encountered while creating Standalone Cash Refund:", error);
            configs.res.message = `Error encountered while creating Standalone Cash Refund: ${error.message}`;
            errorLib.Search_ErrorHandlingInterface({
                id: configs.int_error_id,
                type: "error",
                body: `Error Message: ${error.message} \n\nReceived JSON:` + JSON.stringify(data),
            });
            return configs.res;
        }
    }

    function customerSrch(amsCustomerId, data, configs) {
        try {
            var customerSearchObj = search.create({
                type: "customer",
                filters: [
                    ["custentity_ada_ams_customer_id", "is", amsCustomerId],
                    "AND",
                    ["isinactive", "is", "F"],
                ],
                columns: [
                    search.createColumn({ name: "internalid", label: "ID" }),
                ],
            });

            let count = customerSearchObj.runPaged().count;
            if (count === 0) {
                // Create customer if not found
                return createCustomer(data, configs);
            } else {
                var result = customerSearchObj.run().getRange(0, 1);
                var customer_internalId = result[0].getValue({ name: "internalid" });
                log.debug("Customer found. Internal ID:", customer_internalId);

                return customer_internalId;
            }
        } catch (error) {
            log.error("Error searching for customer:", error);
            configs.res.message = `Error searching for customer: ${error.message}`;
            return null;
        }
    }

    return {
        post: doPost,
    };
});
