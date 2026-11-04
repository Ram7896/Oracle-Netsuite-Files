/*************************************************************************************************************************************
 * Script Name			:	ADA CashSale MuleSoft Integration
 * Author   			:	Manthan Laad
 * Creation date		:	25th July 2023
 * Company	  			:	Capgemini India
 * Description			:	This script creates Cash Sale in NS received from MuleSoft
 * Change Log	  		:	||    Changed By    ||    Date     ||            Description                              ||
                            || Rashmi Desai     || 20-02-2024  ||   Changes made as per the updated datamapping sheet ||
 *************************************************************************************************************************************/

/**
 * RestLet to create a Sales Order Record
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
          name: "custscript_ada_cs_order_tax_item",
        }),
        int_error_id: script.getParameter({
          name: "custscriptada_cash_sale_intf_err_hndlng",
        }),
        res: {
          timeStamp: new Date(),
          csCreated: false,
          txnStatus: `FAILED`,
          message: String,
          cashSaleDocumentNumber: Number,
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
            "No action received for Cash Sale request from MuleSoft: \n\n" +
            JSON.stringify(requestBody),
        });
        log.debug("No action on request", action);

        configs.res.message = `No action on request`;
        return configs.res;
      } else if (action == "CreateCashSale") {
        log.debug("Creating Cash Sale", requestBody);

        return CreateCashSale(requestBody.messageContent, configs);
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

  function CreateCashSale(data, configs) {
    log.debug("Body: ", JSON.stringify(data));
    // Setup values
    const removeLines = [];      

    log.audit("data.externalOrderId", data.externalOrderId);
    // Search to get Parent Sales Order
    if (!!data.externalOrderId) {
      var soSearchObj = search.create({
        type: "salesorder",
        filters: [
          ["externalid", "anyof", data.externalOrderId],
          "AND",
          ["type", "anyof", "SalesOrd"],
          "AND",
          ["mainline", "is", "T"],
        ],
      });
      let soSearchCount = soSearchObj.runPaged().count;
      log.audit(`Search Result count`, soSearchCount);
      if (soSearchCount === 1) {
        try {
          let soId = soSearchObj.run().getRange({
            start: 0,
            end: soSearchCount,
          })[0].id;

          log.audit(`Parent SO ${data.externalOrderId}`, soId);

          // Transforming Sales Order to Cash Sale
          const cashSaleRecord = record.transform({
            fromType: record.Type.SALES_ORDER,
            fromId: soId,
            toType: record.Type.CASH_SALE,
            isDynamic: true,
          });
          // Rashmi : BCM Payment UUID set on External Id on Cash Sale
          cashSaleRecord.setValue({
            fieldId: "externalid",
            value: data.externalPaymentUUID,
          });
          // Rashmi : BCM Payment External Id set on Custom External Transaction field on Cash Sale
          cashSaleRecord.setValue({
              fieldId: "custbody_ada_external_transaction",
              value: data.externalPaymentNumber,
            });
          log.debug("Payment Method",data.paymentOption);

          var refundMethodId = paymentOps.getRefundMethodId(data.paymentOption);
          log.debug("refundMethodId",refundMethodId);
          cashSaleRecord.setValue({
            fieldId: "paymentoption",
            value: refundMethodId,
          });

          cashSaleRecord.setValue({
              fieldId: "custbody_ada_stripe_reference_number",
              value: data.stripeRefNum,
            });

          cashSaleRecord.setValue({
              fieldId: "custbody_ada_last_4_digits_card",
              value: data.lastFourDigit,
          }); 
          
          cashSaleRecord.setValue({
              fieldId: "custbody_ada_card_type",
              value: data.cardType,
          }); 

          cashSaleRecord.setValue({
            fieldId: "trandate",
            value: new Date(data.paymentDate),
          });

          cashSaleRecord.setValue({
              fieldId: "shippingcost",
              value: data.shippingCost,
          });

          cashSaleRecord.setValue({
              fieldId: "custbody_ada_shipping_tax_amount",
              value: data.shippingTaxAmount,
          });

          

          // Selecting Valid Lines on Cash Sale received in JSON
          let itemSublistCount = cashSaleRecord.getLineCount({
            sublistId: "item",
          });

          log.audit("Item Count", itemSublistCount);

          for(let i = 0; i < itemSublistCount; i++) {
            cashSaleRecord.selectLine({
              sublistId: "item",
              line: i,
            });
            let lineNumber = cashSaleRecord.getCurrentSublistValue({
              sublistId: "item",
              fieldId: "custcol_ada_external_line_id",
            });

            const index = data.itemDetails.findIndex(
              (item) => item.externalLineId == lineNumber
            );
            if (index === -1) {
              const item = cashSaleRecord.getCurrentSublistValue({
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
              cashSaleRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "quantity",
                value: quantity,
              });
              cashSaleRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "rate",
                value: rate,
              });
              cashSaleRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "amount",
                value: amount,
              });
              cashSaleRecord.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_ada_tax_amount",
                  value: taxOnLine,
                });
              cashSaleRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "custcol_ada_unit_discount",
                value: unitDiscount,
              });
              cashSaleRecord.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_ada_unit_price",
                  value: unitPrice,
                });

              cashSaleRecord.commitLine({
                sublistId: "item",
              });
            }
          }
           
          // Checking if Tax item is present, if not adding it with proper tax amount
          CheckAndAddTaxItem(cashSaleRecord, data.totalTax, configs);
          log.audit("Remove Lines: ", removeLines);

          // Removing all unwanted lines from Cash Sale
          removeLines.forEach((line) =>
            cashSaleRecord.removeLine({
              sublistId: "item",
              line: line,
              ignoreRecalc: false,
            })
          );

          // Checking if cash sale has any line items except tax item
          let itemCount = cashSaleRecord.getLineCount({
            sublistId: "item",
          });
          log.audit("Items on Cash Sale Before Saving Record", itemCount);
          if (itemCount < 2) {
            throw {
              message:
                "Invalid or No items present on Cash Sale:\n" +
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
                "Invalid Item JSON received:\n" + JSON.stringify(itemDetails.items),
            };
          }
          const cashSaleRecordId = cashSaleRecord.save();
          log.debug("Cash Sale Id", cashSaleRecordId);
          configs.res.message = `Cash Sale Successfully created in NS`;
          configs.res.csCreated = true;
          configs.res.txnStatus = `SUCCESS`;
          configs.res.cashSaleDocumentNumber = search.lookupFields({
            type: search.Type.CASH_SALE,
            id: cashSaleRecordId,
            columns: ["tranid"],
          }).tranid;
        } catch (error) {
          log.debug("Error encountered while creating Cash Sale", error);
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
        configs.res.message = `No Sales Order Found with External Id (${data.externalOrderId})`;
        errorLib.Search_ErrorHandlingInterface({
          id: configs.int_error_id,
          type: "error",
          body:
            `No Sales Order Found with External Id (${data.externalOrderId}) \n\nReceived JSON:` +
            JSON.stringify(configs.receivedJSON),
        });
      }
    } else {
      configs.res.message = `Sales Order External Id cannot be empty.`;
      errorLib.Search_ErrorHandlingInterface({
        id: configs.int_error_id,
        type: "error",
        body:
          `Sales Order External Id cannot be empty. \n\nReceived JSON:` +
          JSON.stringify(configs.receivedJSON),
      });
    }
    return configs.res;
  }

  // Updates taxAmount on tax line, if not present creates tax line with taxAmount
  function CheckAndAddTaxItem(csObj, taxAmount, configs) {
    try {
      const taxLine = csObj.findSublistLineWithValue({
        sublistId: "item",
        fieldId: "item",
        value: configs.tax_item,
      });
      if (taxLine === -1) {
        csObj.selectNewLine({
          sublistId: "item",
        });
        csObj.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "item",
          value: configs.tax_item,
        });
      } else {
        csObj.selectLine({
          sublistId: "item",
          line: taxLine,
        });
      }
      csObj.setCurrentSublistValue({
        sublistId: "item",
        fieldId: "amount",
        value: taxAmount,
      });

      csObj.commitLine({
        sublistId: "item",
      });
    } catch (error) {
      configs.res.message = `Error while adding tax line on Cash Sale: ${error.message}`;
      errorLib.Search_ErrorHandlingInterface({
        id: configs.int_error_id,
        type: "error",
        body:
          `Error while adding tax line on Cash Sale: ${error.message} \n\nReceived JSON:` +
          JSON.stringify(configs.receivedJSON),
      });
      log.debug("Error", error);
    }
  }

  return {
    post: doPost,
  };
});