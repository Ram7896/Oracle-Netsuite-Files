/*************************************************************************************************************************************
 * Script Name			:	ADA UE Sales Order CDT Codes
 * Author   			:	Manthan Laad
 * Creation date		:	2nd August 2023
 * Company	  			:	Capgemini India
 * Description			:	This script adds Marketing Inserts on the creation of sales order, depending on the items on the SO, by referring the Marketing Inserts Custom Record
 * Parameters           :   ||                Name                ||      Type         ||              Id                         ||
 *                          ||        CDT Distribution Type       ||   List/Record     ||   custscript_ada_cdt_dist_type          ||
 *                          ||            Email Group             ||   List/Record     ||   custscript_ada_email_grp_id           ||
 *                          ||           Kit Item Type            ||   List/Record     ||   custscript_ada_kit_item_type          ||
 *                          ||        Scheduled Script Id         ||   List/Record     ||   custscript_ada_cdt_ss_id              ||
 *                          ||  Scheduled Script Deployment Id    ||  Free-Form Text   ||   custscript_ada_cdt_ss_deployment_id   ||
 *
 * Deployment           :   ||      Record      ||                Deployment Id             ||
 *                          ||    Sales Order   ||   customdeploy_ada_so_cdt_code_ue_dply   ||
 *
 * Change Log	  		:	||    Changed By    ||    Date    ||                           Description                      ||
 *                          ||  Manthan Laad    || 09/01/2024 || Added Connection Library and Fulfillment JSON Outbound     ||
 *************************************************************************************************************************************/
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
 define([
    "N/record",
    "N/runtime",
    "N/task",
    "./lib/CDT Codes Functions Library.js",
    "./lib/Integration Connection Library.js",
    "./lib/Error Handling Library.js",
  ], function (record,runtime, task, cdtFunctions, connect, errorLib) {
    function afterSubmit(context) {
      const InterfaceErrorHandling = 1;
      try {
        const SalesOrder = context.newRecord;
        const soId = SalesOrder.id;
  
        const txnSrc = SalesOrder.getValue("custbody_ada_transaction_source");
        log.debug("Transaction Src", txnSrc);  
        log.debug("assigning cdt codes");
        // Getting Required Distribution Types
        const script = runtime.getCurrentScript();
        const cdtDistType = script.getParameter("custscript_ada_cdt_dist_type");
        const kitItemType = script.getParameter("custscript_ada_kit_item_type");
        const groupId = script.getParameter("custscript_ada_email_grp_id");
        const credsId = script.getParameter("custscript_ada_cdt_if_credentials");
        const transactionSource = script.getParameter(
          "custscript_ada_cdt_if_txn_src"
        );
        const shippedStatus = script.getParameter(
          "custscript_ada_order_line_ship_status"
        );
  
        // Getting required search filter data
        let fullfillmentDetails = [];
        let itemSublistCount = SalesOrder.getLineCount({ sublistId: "item" });
        const cdtItemArr = [];
        const itemObj = {
          SalesOrderId: soId,
          FulfillmentObj: undefined,
          fulfillmentOutbound: {
            messageHeader: {
              correlationId: new Date(),
              action: "bcmItemFulfillment",
              commandName: "outbound",
            },
            messageContent: {
                externalOrderId: SalesOrder.getValue("externalid"),
                salesOrderDocumentNumber: SalesOrder.getValue("tranid"),
            },
          },
          groupId,
          email: SalesOrder.getValue("custbody_ada_user_email"),
          customer: parseInt(SalesOrder.getValue("entity")),
          OrderQty: 0,
          CDTitems: [],
          txnSrc,
          credsId,
          connect,
          transactionSource,
          shippedStatus,
        };
  
        log.audit("itemObj: ", itemObj);
        log.audit("Distribution types: ", `${cdtDistType}`);
        log.audit("Item Count", itemSublistCount);
  
        for (let i = 0; i < itemSublistCount; i++) {
          let distType = SalesOrder.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_ada_distribution_type",
            line: i,
          });
          let quantity = parseInt(
            SalesOrder.getSublistValue({
              sublistId: "item",
              fieldId: "quantity",
              line: i,
            })
          );
          const item = parseInt(
            SalesOrder.getSublistValue({
              sublistId: "item",
              fieldId: "item",
              line: i,
            })
          );
          if (distType == cdtDistType) {
            let itemType = SalesOrder.getSublistValue({
              sublistId: "item",
              fieldId: "itemtype",
              line: i,
            });
            if (itemType != kitItemType) {
              itemObj.OrderQty += quantity;
  
              log.debug("Line ", `Line: ${i}, item: ${item}, qty: ${quantity} `);
              const index = itemObj.CDTitems.findIndex((obj) => obj.item == item);
  
              const line = SalesOrder.getSublistValue({
                sublistId: "item",
                fieldId: "orderline",
                line: i,
              });
              const lineId = SalesOrder.getSublistValue({
                sublistId: "item",
                fieldId: "custcol_ada_external_line_id",
                line: i,
              });
              cdtItemArr.push(item);
              if (index === -1) {
                itemObj.CDTitems.push({
                  totalQuantity: quantity,
                  item: item,
                  itemDetails: [{ quantity, soLine: lineId }],
                });
              } else {
                itemObj.CDTitems[index].totalQuantity += quantity;
                itemObj.CDTitems[index].itemDetails.push({
                  quantity,
                  soLine: lineId,
                });
              }
            }
          }
        }
        log.audit("Sales Order Details", itemObj);
        // Fetching Available CDT codes with Years
        if (itemObj.OrderQty > 0) {
          if (itemObj.OrderQty < 450) {
            const CDTcodesIds = cdtFunctions.getCDTCodes(
              cdtItemArr,
              itemObj.CDTitems
            );
  
            log.audit("CDT Codes Obj", CDTcodesIds);
  
            if (CDTcodesIds.length > 0) {
              itemObj.CDTitems.forEach((val) => {
                const item = val.item;
                const codeObj = CDTcodesIds.find((id) => {
                  return id.codeItem == item;
                });
                if (codeObj) {
                  fullfillmentDetails.push({
                    item,
                    fullfilledQty: codeObj.codeIds.length,
                  });
                }
              });
              log.audit("Fullfilment details Obj", fullfillmentDetails);
  
              itemObj.FulfillmentObj = cdtFunctions.createFulfillment(
                soId,
                fullfillmentDetails
              );
              log.debug("SO Obj before assigning codes", itemObj);
              cdtFunctions.assignCDTCodes(itemObj, CDTcodesIds);
             
            
              log.debug("SO Obj after assigning codes", itemObj);
            }
  
            const insuffCodes = cdtFunctions.insufficientCodes(itemObj.CDTitems);
            log.audit("Missing CDT Codes", insuffCodes);
            if (insuffCodes.length > 0) {
              let details = `Sales Order Id: ${itemObj.SalesOrderId}\n\n`;
              insuffCodes.forEach(
                (val) =>
                  (details =
                    details +
                    `Item ${val.item} requires  ${val.reqQty} CDT codes\n`)
              );
              cdtFunctions.sendEmail(details, groupId);
            } else {
            }
          } else {
            log.debug("Create from Scheduled Script");
            itemObj.cdtItemArr = cdtItemArr;
  
            var scriptTask = task.create({
              taskType: task.TaskType.SCHEDULED_SCRIPT,
              scriptId: script.getParameter("custscript_ada_cdt_ss_id"),
              deploymentId: script.getParameter(
                "custscript_ada_cdt_ss_deployment_id"
              ),
              params: {
                custscript_ada_so_obj: itemObj,
              },
            });
            var scriptTaskId = scriptTask.submit();
            log.debug("Scheduled Script Task ID", scriptTaskId);
          }
        } else {
          log.audit("Message:", " No CDT Items Present on SO " + soId);
        }
      } catch (error) {
        log.audit("Error:", error);
        errorLib.Search_ErrorHandlingInterface({
          id: InterfaceErrorHandling,
          type: "error",
          body: error.message,
        });
      }
    }
  
    return {
      afterSubmit: afterSubmit,
    };
  });