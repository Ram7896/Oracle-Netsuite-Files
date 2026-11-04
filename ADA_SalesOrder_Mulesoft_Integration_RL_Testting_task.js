/*************************************************************************************************************************************
 * Script Name			:	ADA Mulesoft Integration RESTlet
 * Author   			:	Karamjeet KAur
 * Creation date		:	25th July 2023
 * Company	  			:	Capgemini India
 * Description			:	This script is used to maintain the REST APIs for MuleSoft - NetSuite Integration
 *                    -> Sales Order Cretation Function added
 *                    -> Basic response setup for all REST calls wherein we return the received request in the response.
 * Change Log	  		:	||    Changed By    ||    Date     ||            Description           ||
                      ||  Manthan Laad    ||  23/12/2023 || Moved Search outside item for loop reducing number of search exectuion from number of items on SO to a single search  ||
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
        .getParameter("custscript_ada_so_error_handling");
      log.debug("inteface_error_handling_id", inteface_error_handling_id);

      if (action == undefined) {
        return {
          PostRequestReceived: requestBody,
          NetSuiteResponse: "Post Request Received From MuleSoft",
        };
      } else if (action == "CreateSalesOrder") {
        log.debug("Creating SO", requestBody);

        return CreateSO(body, requestBody, inteface_error_handling_id);
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
  function CreateSO(data, requestBody, inteface_error_handling_id) {
    let res = {
      timeStamp: new Date(),
    };
    try {
      const currentScript = runtime.getCurrentScript();
      //Get script parameter values.
      const tax_item = currentScript.getParameter({
        name: "custscript_ada_order_tax_item",
      });
      const sales_order_form_id = currentScript.getParameter({
        name: "custscript_ada_so_custom_form",
      });
      const transaction_source_id = currentScript.getParameter({
        name: "custscript_ada_transaction_source",
      });
      const sales_order_currency = currentScript.getParameter({
        name: "custscript_ada_so_currency",
      });
      const customer_subsidiary = currentScript.getParameter({
        name: "custscript_ada_cust_subsidiary",
      });
      const bcm_deploy_id = currentScript.getParameter({
        name: "custscript_ada_rl_bcm_dply_id",
      });
      const cc_param = currentScript.getParameter({
        name: "custscript_ada_rl_unidentified",
      });
      const unidentified_campaign_code = search.lookupFields({
        type: "customrecord_ada_promotions",
        id: cc_param,
        columns: ["name"],
      }).name;
      log.debug("unidentified_campaign_code", unidentified_campaign_code);

      log.debug("DATA:", JSON.stringify(data));
      let amsCustomerId = data.amsCustomerId;

      //Call customer search function.
      let customerId = customerSrch(amsCustomerId);

      if (!customerId) {
        ///Create Customer if its not present
        const customerRec = record.create({
          type: record.Type.CUSTOMER,
        });
        customerRec.setValue({
          fieldId: "subsidiary",
          value: customer_subsidiary,
        });
        if (currentScript.deploymentId == bcm_deploy_id) {
          // BCM Customers
          customerRec.setValue({
            fieldId: "isperson",
            value: "T",
          });
          customerRec.setValue({
            fieldId: "firstname",
            value: data.firstName,
          });
          customerRec.setValue({
            fieldId: "lastname",
            value: data.lastName,
          });
        } else {
          // Non BCM Customers
        }
        customerRec.setValue({
          fieldId: "email",
          value: data.userEmail,
        });
        customerRec.setValue({
          fieldId: "custentity_ada_customer_status",
          value: 2,
        });
        customerRec.setValue({
          fieldId: "custentity_ada_ams_customer_id",
          value: data.amsCustomerId,
        });
        customerId = customerRec.save();
        res.customerId = customerId;
        res.createdCustomer = true;
      }
      log.debug(`Customer: ${customerId}`);

      // Generate Attribute Array
      const attributeArr = generateAttributeArray(data.items);
      log.debug("Attribute Arr", attributeArr);

      /// Sales Order Creation
      var so_Rec = record.create({
        type: record.Type.SALES_ORDER,
        defaultValues: {
          customform: sales_order_form_id,
        },
        isDynamic: true,
      });
      // Set SO field values
      so_Rec.setValue({
        fieldId: "entity",
        value: customerId,
      });
      so_Rec.setValue({
        fieldId: "status",
        value: "Pending Fulfillment",
      });
      so_Rec.setValue({
        fieldId: "externalid",
        value: data.externalOrderId,
      });
      so_Rec.setValue({
        fieldId: "custbody_ada_external_transaction",
        value: data.orderId,
      });
      so_Rec.setValue({
        fieldId: "custbody_ada_company_id",
        value: data.companyId,
      });
      so_Rec.setValue({
        fieldId: "custbody_ada_company_name",
        value: data.companyName,
      });
      var order_date_format = getFormattedDate(data.orderDate);
      log.audit("order_date_format", order_date_format);
      so_Rec.setValue({
        fieldId: "trandate",
        value: new Date(order_date_format), //new Date(data.orderDate),
      });
      so_Rec.setValue({
        fieldId: "otherrefnum",
        value: data.poNumber,
      });
      so_Rec.setValue({
        fieldId: "memo",
        value: data.memo,
      });
      so_Rec.setValue({
        fieldId: "custbody_ada_user_email",
        value: data.userEmail,
      });
      so_Rec.setValue({
        fieldId: "custbody_ada_employee_id",
        value: data.employeeId,
      });
      so_Rec.setValue({
        fieldId: "custbody_ada_order_source",
        value: data.orderSource,
      });
      so_Rec.setValue({
        fieldId: "custbody_ada_transaction_source",
        value: transaction_source_id,
      });
      // Campaign Code Values logic
      let codes = [];
      data.campaignCode.forEach((code) => {
        log.debug(code);
        codes.push(code);
        log.debug("Codes", codes);
        try {
          so_Rec.setText({
            fieldId: "custbody_ada_campaign_code",
            text: codes,
          });
        } catch (e) {
          log.debug("Inside Code Catch loop");
          codes.pop();
          log.debug("Codes length in catch block", codes.length);
          if (codes.length == 0) {
            codes.push(unidentified_campaign_code);
            log.debug("Codes inside Code Catch loop", codes);
            so_Rec.setText({
              fieldId: "custbody_ada_campaign_code",
              text: codes,
            });
          } else {
            log.debug(
              "Unidentified code is already present",
              codes.indexOf(unidentified_campaign_code)
            );
            codes.indexOf(unidentified_campaign_code) === -1
              ? codes.push(unidentified_campaign_code)
              : codes;
            log.debug("Codes inside Code Catch loop", codes);
            so_Rec.setText({
              fieldId: "custbody_ada_campaign_code",
              text: codes,
            });
          }
          /*codes.indexOf(unidentified_campaign_code) === -1
            ? codes.push(unidentified_campaign_code)
            : codes;
          so_Rec.setText({
            fieldId: "custbody_ada_campaign_code",
            text: codes,
          });*/
        }
      });
      so_Rec.setValue({
        fieldId: "shipmethod",
        value: data.shippingMethod,
      });
      so_Rec.setValue({
        fieldId: "shippingcost",
        value: data.shippingCost,
      });
      so_Rec.setValue({
        fieldId: "custbody_ada_shipping_tax_amount",
        value: data.shippingTaxAmount,
      });
      so_Rec.setValue({
        fieldId: "currency",
        value: sales_order_currency,
      });
      if (data.paymentOption === "External Credit Card") {
        so_Rec.setValue({
          fieldId: "paymentoption",
          value: 5801,
        });
      }
      else if (data.paymentOption === "Check") {
        so_Rec.setValue({
          fieldId: "paymentoption",
          value: 2
        });
      }
      else {
        throw new Error("Sales Order creation Failed due to Payment Option is missing.");
      }
      so_Rec.setValue({
        fieldId: "custbody_ada_last_4_digits_card",
        value: data.lastFourDigit,
      });
      so_Rec.setValue({
        fieldId: "custbody_ada_card_type",
        value: data.cardType,
      });
      so_Rec.setText({
        fieldId: "shipcarrier",
        value: "More",
      });
      // Create the Shipping subrecord.
      var shipSubRec = so_Rec.getSubrecord({
        fieldId: "shippingaddress",
      });
      // Set values on the Shipping subrecord.
      shipSubRec.setValue({
        fieldId: "attention",
        value: data.shipToAttention,
      });
      shipSubRec.setValue({
        fieldId: "addressee",
        value: data.shipToAddressee,
      });
      shipSubRec.setValue({
        fieldId: "addrphone",
        value: data.shipToPhone,
      });
      shipSubRec.setValue({
        fieldId: "addr1",
        value: data.shipAddress1,
      });
      shipSubRec.setValue({
        fieldId: "addr2",
        value: data.shipAddress2,
      });
      shipSubRec.setValue({
        fieldId: "city",
        value: data.shipCity,
      });
      shipSubRec.setValue({
        fieldId: "state",
        value: data.shipState,
      });
      shipSubRec.setValue({
        fieldId: "zip",
        value: data.shipZip,
      });
      shipSubRec.setValue({
        fieldId: "country",
        value: data.shipCountry,
      });

      // Create the Billing subrecord.
      var billSubRec = so_Rec.getSubrecord({
        fieldId: "billingaddress",
      });
      // Set values on the Billing subrecord.
      billSubRec.setValue({
        fieldId: "attention",
        value: data.billToAttention,
      });
      billSubRec.setValue({
        fieldId: "addressee",
        value: data.billToAddressee,
      });
      billSubRec.setValue({
        fieldId: "addrphone",
        value: data.billToPhone,
      });
      billSubRec.setValue({
        fieldId: "addr1",
        value: data.billAddress1,
      });
      billSubRec.setValue({
        fieldId: "addr2",
        value: data.billAddress2,
      });
      billSubRec.setValue({
        fieldId: "city",
        value: data.billCity,
      });
      billSubRec.setValue({
        fieldId: "state",
        value: data.billState,
      });
      billSubRec.setValue({
        fieldId: "zip",
        value: data.billZip,
      });
      billSubRec.setValue({
        fieldId: "country",
        value: data.billCountry,
      });

      log.debug("Header Fields Set");
      //    -------------------------- Script Search Optimisation by Manthan --------------------------------------------------
      const itemNameFilter = [];
      const itemCount = data.items.length;
      data.items.forEach((element, i) => {
        if (i === itemCount - 1) {
          itemNameFilter.push(["name", "contains", element.name]);
        } else {
          itemNameFilter.push(["name", "contains", element.name]);
          itemNameFilter.push("OR");
        }
      });
      log.debug("Item Filter Array", itemNameFilter);
      const itemSearchObj = search.create({
        type: "item",
        filters: itemNameFilter,
        columns: [
          { name: "internalid" },
          search.createColumn({
            name: "itemid",
            label: "Name",
          }),
        ],
      });

      const itemSearchCount = itemSearchObj.runPaged().count;
      log.audit(`Search Result count`, itemSearchCount);
      const soItems = [];
      if (itemSearchCount === 0) {
        throw new Error("Item not Found, Product not present in netsuite.");
      }
      itemSearchObj.run().each(function (result, i) {
        let itemId = result.getValue("itemid");
        log.debug('ItemId:', itemId);
        let foundItems = data.items.filter((item) => item.name === itemId);
        if (foundItems.length > 0) {
          foundItems.forEach((item) => {
            item.nsInternalId = result.getValue("internalid");
          });
        } else {
          log.audit(`Item ${itemId} not found!!!`);
        }
        return true;
      });

      log.audit(`Item obj (Manthan)`, data.items);

      //   --------------------------------------------------------------------------------------------------------------
      // Set the sublist field values

      for (let i = 0; i < data.items.length; i++) {
        const element = data.items[i];
        so_Rec.getLineCount({
          sublistId: "item",
        });

        log.debug("SO item Obj " + i + ":", JSON.stringify(element));
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "item",
          value: element.nsInternalId, //search_itemId, element.name,
        });
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "price",
          value: -1,
        });
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "custcol_ada_external_line_id",
          value: element.externalLineId,
        });
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "quantity",
          value: element.quantity,
        });
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "custcol_ada_unit_price",
          value: element.unitPrice,
        });
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "custcol_ada_unit_discount",
          value: element.unitDiscount,
        });
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "rate",
          value: element.rate,
        });
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "amount",
          value: element.amount,
        });
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "custcol_ada_tax_amount",
          value: element.itemTaxAmount,
        });

        if (element.distributionType) {
          so_Rec.setCurrentSublistText({
            sublistId: "item",
            fieldId: "custcol_ada_distribution_type",
            text: element.distributionType,
          });
        }
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "custcol_ada_smartpractice_pid",
          value: element.smartPracticePId,
        });
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "custcol_ada_per_qty_tax",
          value: element.itemTaxAmount / element.quantity,
        });
        so_Rec.commitLine({
          sublistId: "item",
        });
      }
      log.debug("Sublist values set");
      if (data.taxAmount > 0) {
        //Adding tax item Line
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "item",
          value: tax_item,
        });
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "quantity",
          value: 1,
        });
        log.debug("taxamoutn", data.taxAmount);
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "rate",
          value: data.taxAmount,
        });
        so_Rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "amount",
          value: Number(data.taxAmount),
        });
        so_Rec.commitLine({
          sublistId: "item",
        });
      }

      // totalTax = totalTax + data.shippingTaxAmount;
      // log.debug("Total tax including Shipping Tax", totalTax);
      // so_Rec.setValue({
      //   fieldId: "taxtotal",
      //   value: totalTax,
      // });

      var RecID = so_Rec.save();
      if (RecID) {
        createAttributeRecord(attributeArr, RecID);
        const id = record.submitFields({
          type: record.Type.SALES_ORDER,
          id: RecID,
          values: {
            custbodyada_push_smartpractice_order: true,
            custbodyada_push_pbd_order: true,
            custbody_ada_push_tizra_order: true
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true
          }
        });
        log.debug("SO Fields Set", id)
        log.debug(
          "Sales Order record has been created having id" + RecID,
          JSON.stringify(so_Rec)
        );

        res.message = "Sale Order Successfully created in NS";
        res.soCreated = true;
        res.txnStatus = "SUCCESS";
        res.saleOrderDocumentNumber = search.lookupFields({
          type: search.Type.SALES_ORDER,
          id: RecID,
          columns: ["tranid"],
        }).tranid;

        return res;
      }
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

  //Formatting the date in MM-DD-YYYY
  function getFormattedDate(date) {
    try {
      var date_format = new Date(date);
      var month = (1 + date_format.getMonth()).toString();
      var day = date_format.getDate().toString();
      var year = date_format.getFullYear();
      return month + "/" + day + "/" + year;
    } catch (error) {
      log.error(
        "Error encoutered while formatting the  order date",
        error.message
      );
    }
  }

  // Generates Attribute Array
  function generateAttributeArray(items) {
    const transformedArray = [];

    // Iterate through each item in the input array
    for (const item of items) {
      // Extract relevant properties
      if (item.attributes) {
        const { externalLineId, name, attributes } = item;

        // Create a new object with desired properties
        attributes.forEach((attribute) => {
          const transformedItem = {
            attributeName: attribute.attributeName,
            attributeIntegrationName: attribute.attributeIntegrationName,
            attributeValue: attribute.attributeValue,
            externalLineId,
            name,
          };

          // Push the transformed object to the result array
          transformedArray.push(transformedItem);
        });
      }
    }
    return transformedArray;
  }

  //function to create Customer Search.
  function customerSrch(amsCustomerId) {
    try {
      var customerSearchObj = search.create({
        type: "customer",
        filters: [
          ["custentity_ada_ams_customer_id", "is", amsCustomerId],
          "AND",
          ["isinactive", "is", "F"],
        ],
        columns: [
          search.createColumn({
            name: "internalid",
            label: "ID",
          }),
        ],
      });
      let count = customerSearchObj.runPaged().count;
      if (count === 0) {
        return undefined;
      }
      var result = customerSearchObj.run().getRange(0, 2);
      var customer_internalId = result[0].getValue({
        name: "internalid",
      });
      log.debug("customer_internalId", customer_internalId);

      return customer_internalId;
    } catch (error) {
      log.error("Error Message", error);
    }
  }

  function createAttributeRecord(attributeArr, RecID) {
    try {
      log.debug("Attribute Array", attributeArr[0]);
      if (attributeArr.length > 0) {
        for (var j = 0; j < attributeArr.length; j++) {
          const adaPersonalizedAttribute = record.create({
            type: "customrecord_ada_personalized_attributes",
            isDynamic: true,
          });
          log.debug("Record", adaPersonalizedAttribute);
          adaPersonalizedAttribute.setValue({
            fieldId: "custrecord_ada_pers_attribute_name",
            value: attributeArr[j].attributeName,
          });
          adaPersonalizedAttribute.setValue({
            fieldId: "custrecord_ada_pers_attribute_int_name",
            value: attributeArr[j].attributeIntegrationName,
          });
          adaPersonalizedAttribute.setValue({
            fieldId: "custrecord_ada_pers_attribute_value",
            value: attributeArr[j].attributeValue,
          });
          adaPersonalizedAttribute.setValue({
            fieldId: "custrecord_ada_pers_external_line_id",
            value: attributeArr[j].externalLineId,
          });
          adaPersonalizedAttribute.setText({
            fieldId: "custrecord_ada_pers_item",
            value: attributeArr[j].name,
          });
          adaPersonalizedAttribute.setValue({
            fieldId: "custrecord_ada_pers_order",
            value: RecID,
          });
          var attributeRecId = adaPersonalizedAttribute.save();
          log.debug("attributeRecId", attributeRecId);
        }
      }
    } catch (e) {
      log.error("Error in Create Attribute Records", e);
    }
  }

  return {
    post: doPost,
  };
});