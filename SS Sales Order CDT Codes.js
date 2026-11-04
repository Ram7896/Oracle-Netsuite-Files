/*************************************************************************************************************************************
 * Script Name			:	ADA SS Sales Order CDT Codes
 * Author   			  :	Manthan Laad
 * Creation date		:	12th September 2023
 * Company	  			:	Capgemini India
 * Description			:	Depending upon the execution deployment the script Assigns CDT codes to the passed parameter obj or Can be scheduled to run an one time to assign CDT codes which are available at that instant.
 * Parameters           :   ||                Name                 ||      Type         ||              Id                   ||
 *                          ||          SALES ORDER OBJ            ||   Text Area       ||   custscript_ada_so_obj           ||
 *                          ||        SS Job deployment Id         ||   Free-Form Text  ||   custscript_ada_ss_job_dply_id   ||
 *                          ||        SS Task deployment Id        ||   Free-Form Text  ||   custscript_ada_ss_task_dply_id  ||
 *                          ||    One Time Job Saved Search Id     ||   List/Record     ||   custscript_ada_saved_search_id  ||
 *
 * Change Log	  		:	||    Changed By    ||    Date    ||            Description           ||
 *                    ||                  ||            ||                                  ||
 *************************************************************************************************************************************/ /**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
 define([
    "./lib/CDT Codes Functions Library.js",
    "./lib/Integration Connection Library.js",
    "N/runtime",
    "N/search",
  ], function (cdtFunctions, connect, runtime, search) {
    function execute(context) {
      try {
        const scriptObj = runtime.getCurrentScript(); //scriptObj is a runtime.Script object
        log.debug("Script ID: " + scriptObj.deploymentId);
        const itemObjString = scriptObj.getParameter({
          name: "custscript_ada_so_obj",
        });
        let ssJobDplyId = scriptObj.getParameter({
          name: "custscript_ada_ss_job_dply_id",
        });
        let ssTaskDplyId = scriptObj.getParameter({
          name: "custscript_ada_ss_task_dply_id",
        });
        const credsId = scriptObj.getParameter(
          "custscript_ada_if_mule_cred_rec_ss"
        );
        const transactionSource = scriptObj.getParameter(
          "custscript_ada_cdt_if_txn_src_ss"
        );
        const shippedStatus = scriptObj.getParameter(
            "custscript_ship_status"
          );

  
        log.audit("SO Obj String:", itemObjString);
        if (scriptObj.deploymentId === ssTaskDplyId && itemObjString != null) {
          log.audit("One time Job");
          let itemObj = JSON.parse(itemObjString);
          log.audit("SO Obj :", JSON.stringify(itemObj));
  
          // Fetching Available CDT codes with Years
          const soId = itemObj.SalesOrderId;
          let fullfillmentDetails = [];
  
          const CDTcodesIds = cdtFunctions.getCDTCodes(
            itemObj.cdtItemArr,
            itemObj.CDTitems
          );
  
          log.audit("CDT Codes Obj", CDTcodesIds);
  
          if (CDTcodesIds.length > 0) {
            itemObj.CDTitems.forEach((val) => {
              const item = val.item;
              log.debug("Item:", val);
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
            cdtFunctions.assignCDTCodes(itemObj, CDTcodesIds);
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
            cdtFunctions.sendEmail(details, itemObj.groupId);
          }
        } else if (scriptObj.deploymentId === ssJobDplyId) {
          const savedSearchId = scriptObj.getParameter({
            name: "custscript_ada_saved_search_id",
          });
          const salesorderSearchObj = search.load({
            id: savedSearchId,
          });
  
          let salesOrderSearchCount = salesorderSearchObj.runPaged().count;
          log.audit("Sales Order Search result count", salesOrderSearchCount);
          let start = 0;
          let flag = true;
          let searchResults;
          const salesOrderObjArr = [];
          if (salesOrderSearchCount > 0) {
            do {
              searchResults = salesorderSearchObj.run().getRange({
                start: start * 1000,
                end: (start + 1) * 1000,
              });
  
              let prevElement;
              for (let i = 0; i < searchResults.length; i++) {
                const element = searchResults[i];
                log.debug("Result " + i, element);
                let soId = element.id;
                let documentNumber = element.getValue("tranid");
                log.debug("documentNumber",documentNumber);
                let externalId = element.getValue("externalid");
                log.debug("externalId",externalId);
                let userEmail = element.getValue("custbody_ada_user_email");
                let customer = element.getValue({
                  name: "internalid",
                  join: "customerMain",
                });
                const txnSrc = element.getValue(
                  "custbody_ada_transaction_source"
                );
                log.debug("Transaction Src", txnSrc);
                let item = element.getValue("item");
                let quantity = element.getValue("formulanumeric");
                if (flag) {
                  flag = false;
                  salesOrderObjArr.unshift({
                    SalesOrderId: soId,
                    documentNumber: documentNumber,
                    externalId:externalId,
                    groupId: undefined,
                    email: userEmail,
                    customer: customer,
                    OrderQty: quantity,
                    CDTitems: [
                      {
                        totalQuantity: quantity,
                        item: item,
                        itemDetails: [
                          {
                            quantity: quantity,
                          },
                        ],
                      },
                    ],
                    cdtItemArr: [item],
                    txnSrc,
                    credsId,
                    connect,
                    transactionSource,
                    shippedStatus,
                  });
                } else {
                  prevElement = searchResults[i - 1];
                  log.debug(
                    "Prev and Current IDs",
                    "Curr Id : " + soId + "  Prev Id: " + prevElement.id
                  );
                  if (soId != prevElement.id) {
                    salesOrderObjArr.unshift({
                      SalesOrderId: soId,
                      documentNumber: documentNumber,
                      externalId:externalId,
                      groupId: undefined,
                      email: userEmail,
                      customer: customer,
                      OrderQty: quantity,
                      CDTitems: [
                        {
                          totalQuantity: quantity,
                          item: item,
                          itemDetails: [
                            {
                              quantity: quantity,
                            },
                          ],
                        },
                      ],
                      cdtItemArr: [item],
                      txnSrc,
                      credsId,
                      connect,
                      transactionSource,
                      shippedStatus
                    });
                  } else {
                    salesOrderObjArr[0].OrderQty += quantity;
                    const index = salesOrderObjArr[0].CDTitems.findIndex(
                      (val) => val.item == item
                    );
                    const lineId = SalesOrder.getSublistValue({
                      sublistId: "item",
                      fieldId: "custcol_ada_external_line_id",
                      line: i,
                    });
                    if (index == -1) {
                      salesOrderObjArr[0].CDTitems.unshift({
                        totalQuantity: quantity,
                        item: item,
                        itemDetails: [
                          {
                            quantity,
                            soLine: lineId,
                          },
                        ],
                      });
                    } else {
                      salesOrderObjArr[0].CDTitems[index].totalQuantity +=
                        quantity;
                      salesOrderObjArr[0].CDTitems[index].itemDetails.push({
                        quantity,
                        soLine: lineId,
                      });
                    }
                  }
                }
              }
              start++;
            } while (searchResults.length == 1000);
            log.debug("Final Array", salesOrderObjArr);
            log.debug("Final Array Length", salesOrderObjArr.length);
            salesOrderObjArr.forEach((itemObj) => {
              // Fetching Available CDT codes with Years
              const soId = itemObj.SalesOrderId;
              let fullfillmentDetails = [];
  
              const CDTcodesIds = cdtFunctions.getCDTCodes(
                itemObj.cdtItemArr,
                itemObj.CDTitems
              );
  
              log.audit("CDT item Obj", itemObj);
              log.audit("CDT Codes Obj", CDTcodesIds);
              log.audit("Fullfilment details Obj", fullfillmentDetails);
  
              if (CDTcodesIds.length > 0) {
                itemObj.CDTitems.forEach((val) => {
                  const item = val.item;
                  log.debug("Item:", val);
                  log.debug(
                    "Code Ids:",
                    CDTcodesIds.find((id) => {
                      return id.codeItem == item;
                    }).codeIds
                  );
  
                  fullfillmentDetails.push({
                    item,
                    fullfilledQty: CDTcodesIds.find((id) => {
                      return id.codeItem == item;
                    }).codeIds.length,
                  });
                });
                log.audit("CDT Codes Obj", CDTcodesIds);
                log.audit("Fullfilment details Obj", fullfillmentDetails);
  
                itemObj.FulfillmentObj = cdtFunctions.createFulfillment(
                  soId,
                  fullfillmentDetails
                );
                cdtFunctions.assignCDTCodes(itemObj, CDTcodesIds);
                
              }
            });
          }
          log.audit("One Time Job Completed");
        } else {
          log.audit("No Script Parameters Provided");
        }
      } catch (error) {
        log.debug("Error ", error);
      }
    }
  
    return {
      execute: execute,
    };
  });