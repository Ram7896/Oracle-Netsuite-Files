

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
{
    "messageHeader": {
      "correlationId": "2022-02-28T07:37:00.011Z",
      "action": "CreateSalesOrder",
      "commandName": "inbound"
    },
    "messageContent": {
      "amsCustomerId": "00001442",
      "firstName": "CDT",
      "lastName": "Cust",
      "userEmail": "ada2@test.com",
      "externalOrderId": "123413-124322-314222-454233-245351-CDT26", 
      "orderId": "454", 
      "companyId": "16745",
      "companyName": "Test Company",
      "orderDate": "01/30/2024",
      "poNumber": "TestPO1234",
      "memo": "Test Memo",
      "employeeId": "1234567892",
      "orderSource": "Web",
      "campaignCode": ["23201A"],
      "taxAmount": 100,
      "shippingMethod": 7126,
      "shippingCost": "100",
      "shippingTaxAmount": 60,
      "paymentOption": "CC",
      "lastFourDigit":"9999",
      "cardType":"CC",
      "billToAttention": "John Smith",
      "billToAddressee": "Test Dental Office",
      "billToPhone": "999999999",
      "billAddress1": "47 W 13th St",
      "billAddress2": "Apt 214",
      "billCity": "New York",
      "billState": "NY",
      "billZip": "10011",
      "billCountry": "US",
      "shipToAttention": "John Smith",
      "shipToAddressee": "Test Dental Office",
      "shipToPhone": "999999999",
      "shipAddress1": "47 W Street",
      "shipAddress2": "Apt 111",
      "shipCity": "New York",
      "shipState": "NY",
      "shipZip": "100114",
      "shipCountry": "US",
      "items": [
        {
          "externalLineId": "1",
          "name": "CDT2023",
          "quantity": 1,
          "unitPrice": 100,
          "unitDiscount": 20,
          "rate": 80,
          "amount": 160,
          "itemTaxAmount": 20,
          "smartPracticePId": "1234B3D24L42E35"
        },
        {
          "externalLineId": "2",
          "name": "CDT2022",
          "quantity": 1,
          "unitPrice": 100,
          "unitDiscount": 20,
          "rate": 80,
          "amount": 160,
          "itemTaxAmount": 20,
          "smartPracticePId": "1234B3D24L42E35"
        },
        {
          "externalLineId": "3",
          "name": "AS CDT Test Item",
          "quantity": 1,
          "unitPrice": 100,
          "unitDiscount": 20,
          "rate": 80,
          "amount": 160,
          "itemTaxAmount": 20,
          "smartPracticePId": "1234B3D24L42E35"
        }
      ]
    }
  }
