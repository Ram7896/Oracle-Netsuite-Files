/*************************************************************************************************************************************
 * Script Name			:	ADA BCM Inventory Update Integration
 * Author   			:	Manthan Laad
 * Creation date		:	29th November 2023
 * Company	  			:	Capgemini India
 * Description			:	This script is used send Inventory Updates to BCM, when NS receives a GET request.
 * Change Log	  		:	||    Changed By    ||    Date    ||            Description           ||
                            ||                  ||            ||                                  ||
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
    const action = context.action;
    log.debug("Get Request Received", action);
    const script = runtime.getCurrentScript();
    const int_error_id = script.getParameter({
      name: "custscript_ada_invt_updt_intf_err_hndlng",
    });
    const search_id = script.getParameter({
      name: "custscript_ada_bcm_invt_srch",
    });
    try {
      // if (action == "BCMInventoryUpdate") {
        log.debug("Sending Inventory Update to BCM", context);
        return { data: BCMInventoryUpdate(int_error_id,search_id) };
      // } else {
      //   errorLib.Search_ErrorHandlingInterface({
      //     id: int_error_id,
      //     type: "error",
      //     body: `Get Request Received From MuleSoft with invalid Headers ${context}`,
      //   });
      //   return JSON.stringify({
      //     GetRequestReceived: context,
      //     NetSuiteResponse:
      //       "Get Request Received From MuleSoft with invalid Headers",
      //   });
      // }
    } catch (error) {
      log.error("Error in GET", error);
      errorLib.Search_ErrorHandlingInterface({
        id: int_error_id,
        type: "error",
        body: `Error in BCM Inventory Update ${error.message}`,
      });
      return {
        error: true,
        errorMessage: error.message,
      };
    }
  }

  // Sends BCM Inventory Updates to MuleSoft
  function BCMInventoryUpdate(int_error_id,search_id) {
    try {
      const result = search.load({
        type: search.Type.INVENTORY_ITEM,
        id: search_id,
      });
      let resultCount = result.runPaged().count;
      log.debug("Search result count", resultCount);
      let start = 0;
      let searchResults;
      const response = [];
      if (resultCount > 0) {
        do {
          searchResults = result.run().getRange({
            start: start * 1000,
            end: (start + 1) * 1000,
          });
          log.debug("Result", searchResults);
          searchResults.forEach((res) =>
            response.push({
              itemNameNumber: res.getValue("itemid"),
              // type: res.getText("type"),
              externalId: res.getValue("externalid"),
              // location: res.getValue({
              //   name: "name",
              //   join: "inventoryLocation",
              // }),
              quantityAvailable:
                res.getValue("locationquantityavailable") === ""
                  ? 0
                  : Number(res.getValue("locationquantityavailable")),
            })
          );
          start++;
        } while (searchResults.length == 1000);
      }
      log.debug("Response", response);
      return response;
    } catch (error) {
      log.debug(`Error in BCM Inventory Update`, error.message);

      errorLib.Search_ErrorHandlingInterface({
        id: int_error_id,
        type: "error",
        body: `Error in BCM Inventory Update ${error.message}`,
      });
      return {
        error: true,
        errorMessage: error.message,
        response,
      };
    }
  }

  return {
    get: doGet,
  };
});
