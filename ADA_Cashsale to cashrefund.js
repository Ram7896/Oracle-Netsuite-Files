/*************************************************************************************************************************************
 * Script Name			:	ADA CashRefund MuleSoft Integration
 * Author   			:	Manthan Laad 
 * Creation date		:	25th July 2023
 * Company	  			:	Capgemini India
 * Description			:	This script creates Cash Refund in NS received from MuleSoft
 * Change Log	  		:	||    Changed By    ||    Date    ||            Description           ||
                      ||                  ||            ||                                  ||
 *************************************************************************************************************************************/

/**
 * RestLet to create a Cash sale Record
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define([
  "N/search",
  "N/record",
  "N/runtime",
  "./lib/Error Handling Library.js","./lib/ADA reusable Functions.js",
], function (search, record, runtime, errorLib,paymentOps) {
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
        res: {
          timeStamp: new Date(),
          crCreated: false,
          txnStatus: `FAILED`,
          message: String,
          cashRefundDocumentNumber: Number,
        },
        receivedJSON: requestBody,
      };
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
      configs.res.message = `Error in NetSuite: ${error.message}`;
      return configs.res;
    }
  }

  function CreateCashRefund(data, configs) {
    log.debug("Body: ", JSON.stringify(data));
    // Setup values
    const removeLines = [];
    let taxAmount = 0;

    log.audit("data.externalPaymentUUID", data.externalPaymentUUID);
    // Search to get Parent Cash Sale
    if (!!data.externalPaymentUUID) {
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
               name: 'internalid',label: "Internal ID"})
           ],
      });
      let crSearchCount = csSearchObj.runPaged().count;
      log.audit(`Search Result count`, crSearchCount);
      if (crSearchCount === 1) {
        try {
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
          log.debug("refundMethodId",refundMethodId);

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
            log.debug("lineNumber",lineNumber);
            log.debug("data",data.itemDetails.externalLineId);

            const index = data.itemDetails.findIndex(
              (item) => item.externalLineId == lineNumber
            );
            log.debug("index",index);
            log.debug("lineNumber",lineNumber);
            if (index === -1) {
              const item = cashRefundRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId: "item",
              });
              if (item != configs.tax_item) {
                // Adding unwanted items remove line array
                log.debug("Item added to Remove",item)
                log.debug("configs.tax_item",configs.tax_item)
                removeLines.push(i);
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

          // Checking if Tax item is present, if not adding it with proper tax amount
          //CheckAndAddTaxItem(cashRefundRecord, totalTax, configs);
          log.audit("Remove Lines: ", removeLines);

          // Removing all unwanted lines from Cash Refund
          removeLines.forEach((line) =>
            cashRefundRecord.removeLine({
              sublistId: "item",
              line: line,
              ignoreRecalc: false,
            })
          );

         
          // Checking if cash Refund has any line items except tax item
          let itemCount = cashRefundRecord.getLineCount({
            sublistId: "item",
          });
          log.audit("Items on Cash Refund Before Saving Record", itemCount);
          if (itemCount < 2) {
            throw {
              message:
                "Invalid or No items present on Cash Refund:\n" +
                JSON.stringify(data.itemDetails),
            };
          }
          log.debug(
            "Items on received Before Saving Record",
            data.itemDetails.length
          );

          if (itemCount <= data.itemDetails.length) {
            throw {
              message:
                "Invalid Item JSON received:\n" + JSON.stringify(data.itemDetails.items),
            };
          }
          const cashRefundRecordId = cashRefundRecord.save();
          log.debug("Cash Sale Id", cashRefundRecordId);
          configs.res.message = `Cash Refund Successfully created in NS`;
          configs.res.crCreated = true;
          configs.res.txnStatus = `SUCCESS`;
          configs.res.cashRefundDocumentNumber = search.lookupFields({
            type: search.Type.CASH_REFUND,
            id: cashRefundRecordId,
            columns: ["tranid"],
          }).tranid;
        } catch (error) {
          log.debug("Error encountered while creating Cash Refund", error);
          configs.res.message = `Error Message: ${error.message}`;
          errorLib.Search_ErrorHandlingInterface({
            id: configs.int_error_id,
            type: "error",
            body:
              `Error Message: ${error.message} \n\nReceived JSON:` +
              JSON.stringify(configs.receivedJSON),
          });
        }
      } else {
        configs.res.message = `No Cash Sale Found with External Id (${data.externalPaymentUUID})`;
        errorLib.Search_ErrorHandlingInterface({
          id: configs.int_error_id,
          type: "error",
          body:
            `No Cash Sale Found with External Id (${data.externalPaymentUUID}) \n\nReceived JSON:` +
            JSON.stringify(configs.receivedJSON),
        });
      }
    } else {
      configs.res.message = `Cash Sale External Id cannot be empty.`;
      errorLib.Search_ErrorHandlingInterface({
        id: configs.int_error_id,
        type: "error",
        body:
          `Cash Sale External Id cannot be empty. \n\nReceived JSON:` +
          JSON.stringify(configs.receivedJSON),
      });
    }
    return configs.res;
  }
  return {
    post: doPost,
  };
});