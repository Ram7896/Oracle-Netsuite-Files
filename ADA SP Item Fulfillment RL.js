/*************************************************************************************************************************************
 * Script Name			:	ADA SP Item Fulfillment RL
 * Author   			  :	Manthan Laad
 * Creation date		:	14th March 2024
 * Company	  			:	Capgemini India
 * Description			:	This script is used to create Item Fulfillment Record against a Pre Existing Sales Order with SmartPractice Item Lines.
 * Change Log	  		:	||    Changed By    ||    Date     ||            Description           ||
                     ||
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
  "./lib/Error Handling Library.js",
], function (search, record, runtime, errorLib) {
  function doPost(requestBody) {
    const response = {
      timeStamp: new Date(),
    };
    const Script = runtime.getCurrentScript();
    const InterfaceErrorHandling = Script.getParameter(
      "custscript_ada_sp_if_err_handling"
    );
    const orderLineStatus = Script.getParameter(
      "custscript_ada_sp_ordr_line_sts_shp"
    );
    log.debug("orderLineStatus", orderLineStatus);
    const fulfillmentStatus = Script.getParameter(
      "custscript_ada_sp_if_shipped_status"
    );
    try {
      log.debug("Post Request Received", requestBody);
      if (requestBody.messageHeader.action === "SmartPracticeItemFulfillment") {
        createFulfillment(
          requestBody.messageContent,
          response,
          orderLineStatus,
          fulfillmentStatus
        );
        log.debug("Response", response);
      } else {
        throw new Error(
          `Invalid Request Action "${requestBody.messageHeader.action}`
        );
      }
    } catch (e) {
      errorLib.Search_ErrorHandlingInterface({
        id: InterfaceErrorHandling,
        type: "error",
        body: e.message,
      });
      log.error("Error message", e);
      response.message = `Error encountered: ${e.message}`;
      response.txnStatus = "FAILED";
    }
    return response;
  }

  function createFulfillment(
    data,
    response,
    orderLineStatus,
    fulfillmentStatus
  ) {
    log.debug("Received Data", data);
    if (data.documentNumber) {
      // Create Saved Search to fetch Sales Order Internal Id from Document Number
      const SalesorderSearch = search.create({
        type: "salesorder",
        filters: [
          ["type", "anyof", "SalesOrd"],
          "AND",
          ["numbertext", "is", data.documentNumber],
          "AND",
          ["mainline", "is", "T"],
        ],
        columns: [
          search.createColumn({ name: "internalid", label: "Internal ID" }),
        ],
      });
      let count = SalesorderSearch.runPaged().count;
      if (count === 0) {
        // Throws error when no related Sales Order is Found
        response.txnStatus = "FAILED";
        response.fulfillmentCreated = false;
        response.message = `No Sales Order Found with Document Number: ${data.documentNumber}`;
        throw new Error(
          `No Sales Order Found with Document Number: ${data.documentNumber}`
        );
      } else {
        const soResult = SalesorderSearch.run().getRange(0, 1);
        const soId = soResult[0].getValue({
          name: "internalid",
        });

        // Transform Sales Order to Item Fulfillment
        const ItemFullfillment = record.transform({
          fromType: record.Type.SALES_ORDER,
          fromId: soId,
          toType: record.Type.ITEM_FULFILLMENT,
          isDynamic: false,
        });
        ItemFullfillment.setText({
          fieldId: "trandate",
          text: data.shipDate,
        });
        ItemFullfillment.setText({
          fieldId: "shipstatus",
          text: fulfillmentStatus,
        });

        // create an array of line and tracking numbers
        const lineNumbers = data.items.map((item) => {
          return {
            line: item.line,
            trackingNumber: item.trackingNumber,
          };
        });
        log.debug("Line Numbers", lineNumbers);

        // Create Sales Order updation array
        const updateSalesOrderArray = [];
        var ifLineItemCount = ItemFullfillment.getLineCount({
          sublistId: "item",
        });
        log.debug("Item Line Count", ifLineItemCount);
        let shipdate = ItemFullfillment.getText({
          sublistId: "item",
          fieldId: "trandate",
        });
        log.debug("shipdate is ", shipdate);

        for (let i = 0; i < ifLineItemCount; i++) {
          let lineNum = ItemFullfillment.getSublistValue({
            sublistId: "item",
            fieldId: "line",
            line: i,
          });
          log.debug("IF Line No", lineNum);
          let orderlineNum = ItemFullfillment.getSublistValue({
            sublistId: "item",
            fieldId: "orderline",
            line: i,
          });
          log.debug("IF Order Line No", orderlineNum);
          const lineObj = lineNumbers.find((item) => item.line === lineNum);
          log.debug("IF lineObj", lineObj);
          if (lineObj) {
            log.debug("Updating Line", lineNum);
            ItemFullfillment.setSublistValue({
              sublistId: "item",
              fieldId: "custcol_ada_tracking_number",
              line: i,
              value: lineObj.trackingNumber,
            });
            const qty = ItemFullfillment.getSublistValue({
              sublistId: "item",
              fieldId: "quantityremaining",
              line: i,
            });
            ItemFullfillment.setSublistValue({
              sublistId: "item",
              fieldId: "quantity",
              line: i,
              value: qty,
            });
            updateSalesOrderArray.push(lineObj);
          } else {
            ItemFullfillment.setSublistValue({
              sublistId: "item",
              fieldId: "itemreceive",
              line: i,
              value: false,
            });
          }
        }
        const ffId = ItemFullfillment.save();
        if (ffId) {
          log.debug("Fulfillment Created", ffId);
          response.fulfillmentCreated = true;
          response.fulfillmentDocumentNumber = search.lookupFields({
            type: search.Type.ITEM_FULFILLMENT,
            id: ffId,
            columns: ["tranid"],
          }).tranid;

          // Updating Sales Order Line Statuses
          log.debug("Updating Sales Order", updateSalesOrderArray);
          const SalesOrderObj = record.load({
            type: record.Type.SALES_ORDER,
            id: soId,
            isDynamic: false,
          });

          updateSalesOrderArray.forEach((line) => {
            log.debug("Line", line);
            var lineIndex = SalesOrderObj.findSublistLineWithValue({
              sublistId: "item",
              fieldId: "line",
              value: line.line,
            });
            log.debug("lineIndex", lineIndex);
            SalesOrderObj.setSublistValue({
              sublistId: "item",
              fieldId: "custcol_ada_tracking_number",
              line: lineIndex,
              value: line.trackingNumber,
            });
            log.debug("orderLineStatus", orderLineStatus);
            SalesOrderObj.setSublistValue({
              sublistId: "item",
              fieldId: "custcol_ada_order_line_status",
              line: lineIndex,
              value: orderLineStatus,
            });
            SalesOrderObj.setSublistText({
              sublistId: "item",
              fieldId: "custcol_ada_ship_date",
              line: lineIndex,
              text: shipdate,
            });
          });
          SalesOrderObj.setValue({
            fieldId: "custbody_ada_updated_orderline_status",
            value: true,
          });
          const salesOrderId = SalesOrderObj.save();
          if (salesOrderId) {
            log.debug("Sales Order Updated", salesOrderId);
            response.txnStatus = "SUCCESS";
          } else {
            response.txnStatus = "FAILED";
            response.message = "Unable to Update Sales Order Lines";
          }
        } else {
        }
      }
      return response;
    }
  }

  return {
    post: doPost,
  };
});
