/*************************************************************************************************************************************
 * Script Name			:	ADA SO Update OL Status WA
 * Author   			  :	Manthan Laad
 * Creation date		:	27th March 2024
 * Company	  			:	Capgemini India
 * Description			:	Sets value of Order Line Status checkbox on Sales Order when Fulfillment is created via UI.
 * Change Log	  		:	||    Changed By    ||    Date     ||            Description           ||
                     ||
 *************************************************************************************************************************************/
/**
 *@NApiVersion 2.1
 *@NScriptType WorkflowActionScript
 */

define(["N/record", "N/runtime"], function (record, runtime) {
  function onAction(scriptContext) {
    try {
      log.debug("WFA", "Triggered");
      let currentScript = runtime.getCurrentScript();
      //Get script parameter values.
      let orderLineStatus = currentScript.getParameter({
        name: "custscript_ada_od_line_shipped_status",
      });
      log.debug("WFA", "Triggered");
      //Loading Fufillment Record
      const fulfillmentRecord = scriptContext.newRecord;

      //getting value for SalesOrder Id
      const salesOrderId = fulfillmentRecord.getValue({
        fieldId: "createdfrom",
      });

      // Create Sales Order updation array
      const updateSalesOrderArray = [];
      let ifLineItemCount = fulfillmentRecord.getLineCount({
        sublistId: "item",
      });
      log.debug("Item Line Count", ifLineItemCount);

      for (let i = 0; i < ifLineItemCount; i++) {
        updateSalesOrderArray.push({
          line: fulfillmentRecord.getSublistValue({
            sublistId: "item",
            fieldId: "orderline",
            line: i,
          }),
          trackingNumber: fulfillmentRecord.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_ada_tracking_number",
            line: i,
          }),
          shipDate: fulfillmentRecord.getText({
            fieldId: "trandate",
          }),
        });
      }

      log.debug("updateSalesOrderArray", updateSalesOrderArray);
      if (salesOrderId) {
        // Updating Sales Order Line Statuses
        log.debug("Updating Sales Order", updateSalesOrderArray);
        const SalesOrderObj = record.load({
          type: record.Type.SALES_ORDER,
          id: salesOrderId,
          isDynamic: false,
        });

        updateSalesOrderArray.forEach((line) => {
          log.debug("Line", line);
          let lineIndex = SalesOrderObj.findSublistLineWithValue({
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
          log.debug(" line.shipDate", line.shipDate);

          SalesOrderObj.setSublistText({
            sublistId: "item",
            fieldId: "custcol_ada_ship_date",
            line: lineIndex,
            text: line.shipDate,
          });
          log.debug("orderLineStatus", orderLineStatus);
          SalesOrderObj.setSublistText({
            sublistId: "item",
            fieldId: "custcol_ada_order_line_status",
            line: lineIndex,
            text: orderLineStatus,
          });
        });
        SalesOrderObj.setValue({
          fieldId: "custbody_ada_updated_orderline_status",
          value: true,
        });
        const savedSO = SalesOrderObj.save();
        log.debug("Sales Order Fields Updated", savedSO);
      }
    } catch (e) {
      log.error({
        title: "Error Code",
        details: e,
      });
    }
  }
  return {
    onAction: onAction,
  };
});
