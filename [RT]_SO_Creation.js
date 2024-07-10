/*************************************************************************************************************************************
 * Script Name          :   ADA Mulesoft Integration RESTlet
 * Author               :   Karamjeet Kaur
 * Creation date        :   25th July 2023
 * Company              :   Capgemini India
 * Description          :   This script is used to maintain the REST APIs for MuleSoft - NetSuite Integration
 *                    -> Sales Order Creation Function added
 *                    -> Basic response setup for all REST calls wherein we return the received request in the response.
 * Change Log           :   ||    Changed By    ||    Date     ||            Description           ||
                      ||  Manthan Laad    ||  23/12/2023 || Moved Search outside item for loop reducing number of search execution from number of items on SO to a single search  ||
                      ||  Manthan Laad    ||  02/02/2024 || Reworked on script due to changes to inbound JSON ||
                      ||  Manthan Laad    ||  28/02/2024 || Changes to values in inbound JSON for campaignCode and shippingMethod and removed StripeaReferenceNumber ||
                      ||  Rashmi Desai    ||  28/03/2024 || Tax line is only added if Tax Amount is greater than 0 || 
                      |  Rama Sudhakar   ||  18/04/2024 || Payment option check and ||  
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
    log.debug("Post Request Received", requestBody);
    try {
      const action = requestBody.messageHeader.action;
      const body = requestBody.messageContent;

      var inteface_error_handling_id = runtime
        .getCurrentScript()
        .getParameter("custscript_ada_so_error");
      log.debug("inteface_error_handling_id", inteface_error_handling_id);

      if (action == undefined) {
        return {
          PostRequestReceived: requestBody,
          NetSuiteResponse: "Post Request Received From MuleSoft",
        };
      } else if (action == "SalesOrderCreation") {
        log.debug("Creating SO", requestBody);

        return SalesOrderCreation(body, requestBody, inteface_error_handling_id);
      } else {
        errorLib.Search_ErrorHandlingInterface({
          id: inteface_error_handling_id,
          type: "error",
          body:
            "Invalid action on received JSON:  \n\n" +
            JSON.stringify(requestBody),
        });
        log.debug("Invalid Action: ", action);
      }
    } catch (e) {
      errorLib.Search_ErrorHandlingInterface({
        id: inteface_error_handling_id,
        type: "error",
        body:
          "Invalid action on received JSON:  \n\n" +
          JSON.stringify(requestBody),
      });
      log.error("Error message", e);

      return {
        timeStamp: new Date(),
        message: `Error encountered: ${e.message}`,
      };
    }
  }

  // This function creates a Sales Order in NS based on the data received
  function SalesOrderCreation(body, requestBody, inteface_error_handling_id) {
    let res = {
      timeStamp: new Date(),
    };
    try {
      /// Sales Order Creation
      var so_Rec = record.create({
        type: record.Type.SALES_ORDER,
        isDynamic: true,
      });
      // Set SO field values
      so_Rec.setValue({
        fieldId: "entity",
        value: body.entity,
      });
      so_Rec.setValue({
        fieldId: "externalid",
        value: body.externalId,
      });
      so_Rec.setValue({
        fieldId: "memo",
        value: body.memo,
      });

      // Loop through items and add them to the sales order
      for (let i = 0; i < body.items.length; i++) {
        const element = body.items[i];
        log.debug("Item Count:", element);

        so_Rec.selectNewLine({
          sublistId: "item",
        });
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "item",
          value: element.item, //search_itemId, element.name,
        });
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "quantity",
          value: element.quantity,
        });
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "taxcode",
          value: element.taxcode,
        });
        so_Rec.commitLine({
          sublistId: "item",
        });
      }

      var RecID = so_Rec.save({
        enableSourcing: true,
        ignoreMandatoryFields: true,
      });

        res.message = "Sale Order Successfully created in NS";
        res.soCreated = true;
        res.txnStatus = "SUCCESS";
    res.saleOrderDocumentNumber = RecID

        return res;
    } catch (error) {
      log.error("Error while creating Sales Order", error);
      res.message = `Error Message: ${error.message}`;
      res.soCreated = false;
      res.txnStatus = `FAILED`;
      errorLib.Search_ErrorHandlingInterface({
        id: inteface_error_handling_id,
        type: "error",
        body:
          `Error Message: ${error.message} \n\n Received JSON:` +
          JSON.stringify(requestBody),
      });

      return res;
    }
  }

  // Formatting the date in MM-DD-YYYY
  function getFormattedDate(date) {
    try {
      var date_format = new Date(date);
      var month = (1 + date_format.getMonth()).toString();
      var day = date_format.getDate().toString();
      var year = date_format.getFullYear();
      return month + "/" + day + "/" + year;
    } catch (error) {
      log.error(
        "Error encountered while formatting the order date",
        error.message
      );
    }
  }

  return {
    post: doPost,
  };
});
