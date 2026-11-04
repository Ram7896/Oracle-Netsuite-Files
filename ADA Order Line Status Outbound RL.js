/*************************************************************************************************************************************
 * Script Name			:	ADA BCM Inventory Update Integration
 * Author   			:	Manthan Laad
 * Creation date		:	12th February 2024
 * Company	  			:	Capgemini India
 * Description			:	This script is used send Order Line Status Updates to BCM, when NS receives a GET request.
 * Change Log	  		:	||    Changed By    ||    Date          ||            Description                    ||
                      ||    Rashmi Desai  ||  5-March-2024    ||   Added new fuction to build Item Object  ||
                      ||    Rashmi Desai  ||  5-March-2024    ||   Upadted the outbound for Kit Item       ||
 *************************************************************************************************************************************/

/**
 * RestLet to send Inventory Update to BCM
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(["N/search", "N/runtime", "./lib/Error Handling Library.js"], function (
  search,
  runtime,
  errorLib
) {
  function doGet(context) {
    try {
      const id = context.id;
      log.debug("Get Request Received", id);
      const script = runtime.getCurrentScript();
      const InterfaceError = script.getParameter({
        name: "custscript_ada_od_status_intf_err_hndl",
      });
      const OrderLineSearch = script.getParameter({
        name: "custscript_ada_od_status_srch",
      });
      const CDTDistributionType = script.getParameter({
        name: "custscript_ada_od_status_dist_type",
      });
      const SmartPracticeDistributionType = script.getParameter({
        name: "custscript_ada_od_status_smrt_prct",
      });
      const USPSString = script.getParameter({
        name: "custscript_ship_method_cont_usps",
      });
      const SmrtPrctTrckURL = script.getParameter({
        name: "custscript_smrt_prc_trk_url",
      });
      const NonSmrtPrcUSPSTrckURL = script.getParameter({
        name: "custscript_non_smrt_prc_usps_trk_url",
      });
      const NonSmrtPrcNonUSPSTrckURL = script.getParameter({
        name: "custscriptnon_smrt_prc_non_usps_trk_url",
      });
      const itemTypeParameter = script.getParameter({
        name: "custscript_ada_item_type",
      });
      log.debug("itemTypeParameter", itemTypeParameter);
      log.debug("Order Line Search", OrderLineSearch);
      const result = search.load({
        id: OrderLineSearch,
      });
      result.filters.push(
        search.createFilter({
          name: "externalid",
          operator: search.Operator.ANYOF,
          values: id,
        })
      );
      let resultCount = result.runPaged().count;
      log.debug("Search result count", resultCount);
      let start = 0;
      let searchResults;
      let prevLineExtId;
      let currLineExtId;
      let itemType;
      const response = {
        messageHeader: {
          correlationId: new Date(),
          action: "NSPullOrderLineStatus",
          commandName: "outbound",
        },
        messageContent: {
          items: [],
        },
      };
      if (resultCount > 0) {
        const cdtCodes = [];
        do {
          searchResults = result.run().getRange({
            start: start * 1000,
            end: (start + 1) * 1000,
          });
          log.debug("Result", searchResults);

          searchResults.forEach((res, i) => {
            response.messageContent.externalId = res.getValue("externalid");
            response.messageContent.saleOrderDocumentNumber =
              res.getValue("tranid");
            currLineExtId = res.getValue("custcol_ada_external_line_id");
            const DistributionType = res.getValue(
              "custcol_ada_distribution_type"
            );

            itemType = res.getValue({
              name: "type",
              join: "item",
              label: "Type",
            });
            log.debug("Item Type : ", itemType);
            if (currLineExtId == prevLineExtId) {
              if (DistributionType == CDTDistributionType) {
                log.debug("cdtCodes", cdtCodes);
                log.debug("currLineExtId", currLineExtId);
                let foundLineExtId = cdtCodes.filter(function (data) {
                  return data.externalLineId == currLineExtId;
                });
                log.debug("foundLineExtId", foundLineExtId);
                if (foundLineExtId != "") {
                  var lineIndex = cdtCodes.indexOf(foundLineExtId[0]);
                  log.debug("lineIndex", lineIndex);
                  if (lineIndex >= 0) {
                    log.debug("lineIndex", lineIndex);
                    const cdtCodeName = cdtCodes[lineIndex].cdtCodesName;
                    cdtCodeName.push(
                      res.getValue({
                        name: "name",
                        join: "CUSTRECORD_ADA_CDT_ORDER_ID",
                      })
                    );
                    cdtCodes[lineIndex].cdtCodesName = cdtCodeName;
                  }
                }
              }
            }
            if (currLineExtId != prevLineExtId) {
              const cdtCodeJSON = { externalLineId: "", cdtCodesName: [] };
              const cdtCodeName = [];

              log.debug("Line ${i}", "Pushed to Items");
              const itemName = res.getValue("custcol_ava_item");
              const itemObj = buildItemObject(
                res,
                itemName,
                DistributionType,
                SmartPracticeDistributionType,
                SmrtPrctTrckURL,
                USPSString,
                NonSmrtPrcUSPSTrckURL,
                NonSmrtPrcNonUSPSTrckURL
              );
              log.debug("Item ${i}", itemObj);

              if (DistributionType == CDTDistributionType) {
                cdtCodeName.push(
                  res.getValue({
                    name: "name",
                    join: "CUSTRECORD_ADA_CDT_ORDER_ID",
                  })
                );
                log.debug("cdtCodeName", cdtCodeName);
                cdtCodeJSON.externalLineId = currLineExtId;
                cdtCodeJSON.cdtCodesName = cdtCodeName;
                log.debug("cdtCodeJSON", cdtCodeJSON);
                cdtCodes.push(cdtCodeJSON);
              }

              response.messageContent.items.push(itemObj);
              if (itemType == "Kit") {
                const memberItems = getKitItemComponents(itemName);
                for (var i = 0; i < memberItems.length; i++) {
                  const memberObj = buildItemObject(
                    res,
                    memberItems[i],
                    DistributionType,
                    SmartPracticeDistributionType,
                    SmrtPrctTrckURL,
                    USPSString,
                    NonSmrtPrcUSPSTrckURL,
                    NonSmrtPrcNonUSPSTrckURL
                  );
                  memberObj.bcmParentOrderItemId = currLineExtId;
                  delete memberObj.externalLineId;
                  log.debug("Kit Item ${i}", memberObj);
                  response.messageContent.items.push(memberObj);
                  log.debug("Item ${i}", itemObj);
                }
              }
              prevLineExtId = currLineExtId;
            }

            log.debug("I loop", i);

            log.debug("Result ${i}", res);
          });
          start++;
        } while (searchResults.length == 1000);
        log.debug("CDT Codes Array", cdtCodes);
        // Manthan Changes to Update Response with CDT Code Values on external id
        response.messageContent.items = response.messageContent.items.map(
          (item) => {
            const matchingCode = cdtCodes.find(
              (code) => code.externalLineId === item.externalLineId
            );
            if (matchingCode) {
              return {
                ...item,
                cdtcodeName: matchingCode.cdtCodesName,
              };
            }
            return item;
          }
        );
      }

      log.debug("Response", response);
      return response;
    } catch (error) {
      log.error("Error in Main Function", error);
      return error;
    }
  }
  function buildItemObject(
    res,
    itemName,
    DistributionType,
    SmartPracticeDistributionType,
    SmrtPrctTrckURL,
    USPSString,
    NonSmrtPrcUSPSTrckURL,
    NonSmrtPrcNonUSPSTrckURL
  ) {
    try {
      const OrderLineTrackingNumber = res.getValue(
        "custcol_ada_tracking_number"
      );

      const shipMethod = res.getValue({
        name: "formulatext",
      });
      const itemObj = {
        name: itemName,
        sentToVendor: res.getValue("custcol_ada_sent_to_vendor"),
        shipDate: res.getValue("custcol_ada_ship_date"),
        trackingNumber: OrderLineTrackingNumber,
        trackingUrl: "",
        shipMethod: shipMethod,
        externalLineId: res.getValue("custcol_ada_external_line_id"),
        orderlineStatus: res.getText("custcol_ada_order_line_status"),
        bcmParentOrderItemId: "",
        cdtcodeName: [],
      };
      if (OrderLineTrackingNumber != "") {
        if (DistributionType == SmartPracticeDistributionType) {
          itemObj.trackingUrl = SmrtPrctTrckURL.replaceAll(
            "OrderLineTrackingNumber",
            OrderLineTrackingNumber
          );
        } else {
          if (shipMethod.includes(USPSString)) {
            itemObj.trackingUrl = NonSmrtPrcUSPSTrckURL.replaceAll(
              "OrderLineTrackingNumber",
              OrderLineTrackingNumber
            );
          } else {
            itemObj.trackingUrl = NonSmrtPrcNonUSPSTrckURL.replaceAll(
              "OrderLineTrackingNumber",
              OrderLineTrackingNumber
            );
          }
        }
      }
      return itemObj;
    } catch (e) {
      log.error("Error in Build Item Object", e);
    }
  }
  function getKitItemComponents(itemName) {
    try {
      var kititemSearchObj = search.create({
        type: "kititem",
        filters: [["type", "anyof", "Kit"], "AND", ["name", "is", itemName]],
        columns: [
          search.createColumn({ name: "memberitem", label: "Member Item" }),
          search.createColumn({
            name: "itemid",
            sort: search.Sort.ASC,
            label: "Name",
          }),
        ],
      });
      var searchResultCount = kititemSearchObj.runPaged().count;
      log.debug("kititemSearchObj result count", searchResultCount);
      const kitItems = [];
      kititemSearchObj.run().each(function (result) {
        kitItems.push(result.getText("memberitem"));
        return true;
      });
      log.debug("kitItems", kitItems);
      return kitItems;
    } catch (e) {
      log.error("Error in Kit Item Search", e);
    }
  }
  return {
    get: doGet,
  };
});
