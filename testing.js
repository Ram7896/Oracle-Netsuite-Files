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
], function (search, record, runtime, errorLib, paymentOps) {
     function doPost(requestBody) {
          log.debug("Post Request Received", requestBody);
          // Initialising setup variables
          const script = runtime.getCurrentScript();
          let configs = {
               tax_item: script.getParameter({
                    name: "custscriptcustscript_ada_cs_order_tax_it",
               }),
               int_error_id: script.getParameter({
                    name: "custscript_ada_cash_sale_intf_err_hndlng",
               }),
          };
          log.debug("Configs", JSON.stringify(configs));
     }
     let amsCustomerId = data.amsCustomerId;
     //Call customer search function.
     let customerId = customerSrch(amsCustomerId);

     if (customerId) {
          //create cash refund customer exists
          return createStandAloneCashRefund(data, configs);
     }
     //Customer is not their create customer and create standardalone cash sale
     // if (!customerId) {
     ///Create Customer if its not present
     function CreateCustomer(data) {
          const customerRec = record.create({
               type: record.Type.CUSTOMER,
          });
          customerRec.setValue({//mandatory
               fieldId: "subsidiary",
               value: customer_subsidiary,
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
          customerId = customerRec.save();
          res.customerId = customerId;
          res.createdCustomer = true;
          // }
          log.debug(`Customer: ${customerId}`);
          return createStandAloneCashRefund(data, configs);
     }
     function createStandAloneCashRefund(data, configs) {
          log.debug("Body: ", JSON.stringify(data));
          try {
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
               })

               cashRefundRecord.setValue({
                    fieldId: "custbody_ada_stripe_reference_number",
                    value: data.stripeRefNumber,
               });

               cashRefundRecord.setValue({
                    fieldId: "shippingcost",
                    value: data.shippingCost,
               });
               cashRefundRecord.setValue({
                    fieldId: "shipmethod",
                    value: data.shippingMethod,
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
               let SublistItems = data.itemDetails.length;
               log.debug("Sublist Items Count:", SublistItems);
               for (let i = 0; i < SublistItems; i++) {
                    cashRefundRecord.selectLine({
                         sublistId: "item",
                         line: i,
                    });
                    let lineNumber = cashRefundRecord.getCurrentSublistValue({
                         sublistId: "item",
                         fieldId: "custcol_ada_external_line_id",
                    });
                    // Setting sublist values and calculating total tax amount on Cash Sale
                    const externalLineId = data.itemDetails[i].externalLineId;
                    const Name = data.itemDetails[i].name;
                    const quantity = data.itemDetails[i].quantity;
                    const unitDiscount = data.itemDetails[i].unitDiscount;
                    const unitPrice = data.itemDetails[i].unitPrice;
                    const rate = data.itemDetails[i].rate;
                    const amount = data.itemDetails[i].amount;
                    const itemTaxAmount = data.itemDetails[i].itemTaxAmount;
                    cashRefundRecord.setCurrentSublistValue({
                         sublistId: "item",
                         fieldId: "custcol_ada_external_line_id",
                         value: externalLineId,
                    });
                    cashRefundRecord.setCurrentSublistValue({
                         sublistId: "item",
                         fieldId: "item",
                         value: Name,
                    });
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
                    const cashRefundRecordId = cashRefundRecord.save();
                    log.debug("Cash Sale Id", cashRefundRecordId);
                    configs.res.message = `Cash Refund Standalone Successfully created in NS`;
                    configs.res.crCreated = true;
                    configs.res.txnStatus = `SUCCESS`;
                    configs.res.cashRefundDocumentNumber = search.lookupFields({
                         type: search.Type.CASH_REFUND,
                         id: cashRefundRecordId,
                         columns: ["tranid"],
                    }).tranid;
               }
          } catch (error) {
               log.debug("Error encountered while creating Standalone Cash Refund", error);
               configs.res.message = `Error Message: ${error.message}`;
               errorLib.Search_ErrorHandlingInterface({
                    id: configs.int_error_id,
                    type: "error",
                    body:
                         `Error Message: ${error.message} \n\nReceived JSON:` +
                         JSON.stringify(configs.receivedJSON),
               });
          }
     }
     //function to create Customer Search.
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
                    return CreateCustomer;
               }
               var result = customerSearchObj.run().getRange(0, 1);
               var customer_internalId = result[0].getValue({
                    name: "internalid",
               });
               log.debug("customer_internalId", customer_internalId);

               return customer_internalId;
          } catch (error) {
               log.error("Error Message In Saved Search:", error);
          }
     }
     return {
          post: doPost,
     };
});
