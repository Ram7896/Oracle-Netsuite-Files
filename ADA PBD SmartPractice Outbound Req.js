/*************************************************************************************************************************************
* Script fieldId			:	ADA PBD SmartPractice Outbound Req UE
* Author   			:	Karamjeet Kaur
* Creation date		:	23rd November 2023
* Company	  			:	Capgemini India
* Description			:	This script is used to create the two different JSON object for PBD and SmartPractice on the creation of Sales Order
* Change Log	  		:	||    Changed By         ||    Date        ||            Description                                    ||
                            ||    Vaibhavi  Manchala ||    3/12/2024   ||   Updated script as per the new datamapping sheet         ||
                            ||    Rashmi Desai       ||    3/21/2024   ||   Updated script as per the PBD team request              || 
                            ||    Rashmi Desai       ||    3/27/2024   ||   Updated script to hit mulesoft and process the          ||
                                                                       ||   response received from PBD                              ||
                            ||    Rashmi Desai       ||    4/3/2024    ||   Updated Tizra JSON as per the Payload shared by Dominic ||                                           
*************************************************************************************************************************************/

/**
* @NApiVersion 2.1
* @NScriptType UserEventScript
* @NModuleScope SameAccount
*/
define(["N/search", "N/record", "N/https", "N/runtime", "./lib/Integration Connection Library.js"], 
function (
  search,
  record,
  https,
  runtime,
  connect
)
{
  function afterSubmit(context) 
  {
      try 
      {     
        log.debug("context.type", context.type);                
        const pushPbdCheck = context.newRecord.getValue("custbodyada_push_pbd_order");
        const pushSPCheck = context.newRecord.getValue("custbodyada_push_smartpractice_order");
        log.debug("Trigger PBD",pushPbdCheck);
        log.debug("Trigger SP",pushSPCheck);
        //log.debug("runtime.executionContext",runtime.executionContext);
    
          if ((runtime.executionContext === runtime.ContextType.USER_INTERFACE && context.type === context.UserEventType.CREATE)||
              ((context.type === context.UserEventType.EDIT || context.type === context.UserEventType.XEDIT) && (pushPbdCheck === true || pushSPCheck === true))
          ) 
          {
              var triggerPbd = true;
              var triggerSP = true;
              var newRecord = context.newRecord;
              var recid = newRecord.id;
              if(context.type === context.UserEventType.EDIT && pushPbdCheck != true)
                triggerPbd = false;
              else if(context.type === context.UserEventType.EDIT && pushSPCheck != true)
                triggerSP = false;

              log.debug("triggerPbd",triggerPbd);
              log.debug("triggerSP",triggerSP);

              //Get script parameter value.
              
              var salesOrder_rec = record.load({
                  type: record.Type.SALES_ORDER,
                  id: recid,
              });

              var ada_order_line_status = runtime.getCurrentScript().getParameter("custscript_ada_order_line_status");
              log.debug("ada order line status", ada_order_line_status);

              var ada_kit_item_search = runtime.getCurrentScript().getParameter("custscript_kit_item_save_search");
              log.debug("ada_kit_item_search", ada_kit_item_search);

              var ada_order_line_status_error = runtime.getCurrentScript().getParameter("custscript_ada_order_line_status_error");
              log.debug("ada order line status", ada_order_line_status_error);

              const pbdIntegRecId = runtime.getCurrentScript().getParameter("custscript_pbd_os_int_rec");

              ///Calling the function to get the JSOn objects
              var pbd_smartPractice_function = get_PBD_SmartPractice_Data(salesOrder_rec, ada_kit_item_search);
              var date = new Date();
              ///JOSN on=bject for PBD
              if(triggerPbd === true)
              {
                var PBD_jsondata = pbd_smartPractice_function.PBD_salesOrder_json;
                var PBDjson = JSON.stringify(PBD_jsondata);
                log.debug("PBDjson", PBDjson);
                const response = JSON.parse(
                    connect.IntegrationConnection(PBD_jsondata, pbdIntegRecId)
                  );
                log.debug("MuleSoft Response", response.status);
                var PBD_line_no = pbd_smartPractice_function.PBD_lines;
                log.debug("PBD_line_no", PBD_line_no);
                if(response.status == 201)
                {
                    ///Updating the PBD lines on SO
                    for (var j = 0; j < PBD_line_no.length; j++) 
                    {
                        
                        var lineIndex = salesOrder_rec.findSublistLineWithValue({
                            sublistId: "item",
                            fieldId: "line",
                            value: PBD_line_no[j],
                          });
                        log.debug("Updating PBD Lines", lineIndex);  
                        toUpdateResponseOnSO(salesOrder_rec,lineIndex,ada_order_line_status,date);
                    }
                }
                else
                {
                    var errorMessage = response.errors[0].errorCode + " : "+response.errors[0].errorMessage;
                    log.debug("Error Message", errorMessage);
                    ///Updating the PBD lines on SO
                    for (var j = 0; j < PBD_line_no.length; j++) 
                    {
                        var lineIndex = salesOrder_rec.findSublistLineWithValue({
                            sublistId: "item",
                            fieldId: "line",
                            value: PBD_line_no[j],
                          });
                        log.debug("Updating PBD Lines", lineIndex);
                        toUpdateResponseOnSO(salesOrder_rec,lineIndex,ada_order_line_status_error,date,errorMessage);

                    }
                }
                salesOrder_rec.setValue("custbodyada_push_pbd_order",false);
              }  

              ///JSON object for SmartPractice
              if(triggerSP === true)
              {
                var SmartPractice_jsondata = pbd_smartPractice_function.SmartPractice_json;
                var smartPractice_json = JSON.stringify(SmartPractice_jsondata);
                log.debug("smartPractice_json", smartPractice_json);
                ///Updating the SmartPractice lines on SO
                var SmartPractice_line_no =
                  pbd_smartPractice_function.SmartPractice_lines;
                log.debug("smartpractice_lines", SmartPractice_line_no);
                
                /*for (var k = 0; k < SmartPractice_line_no.length; k++) {
                    salesOrder_rec.setSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_ada_order_line_status",
                        line: SmartPractice_line_no[k] - 1,
                        value: ada_order_line_status,
                    });
                    salesOrder_rec.setSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_ada_sent_to_vendor",
                        line: SmartPractice_line_no[k] - 1,
                        value: date,
                    });
                }*/
                salesOrder_rec.setValue("custbodyada_push_smartpractice_order",false);
              }
              var rec = salesOrder_rec.save();
              log.debug("rec", rec);
              

              var Tizra_jsondata = pbd_smartPractice_function.Tizra_json
              var tizra_json = JSON.stringify(Tizra_jsondata);
              log.debug("tizra_json", tizra_json);

              //JSON for PBD and SmartPractice lines numbers              


          }
      }
      catch (err)
      {
          log.error("Error In main Function", err);
      }
  }

  function toUpdateResponseOnSO(salesOrder_rec,lineIndex,ada_order_line_status,date,errorMessage)
  {
    try{

        salesOrder_rec.setSublistValue({
            sublistId: "item",
            fieldId: "custcol_ada_order_line_status",
            line: lineIndex,
            value: ada_order_line_status,
        });
        salesOrder_rec.setSublistValue({
            sublistId: "item",
            fieldId: "custcol_ada_sent_to_vendor",
            line: lineIndex,
            value: date,
        });   
        if(errorMessage) 
        {
            salesOrder_rec.setSublistValue({
                sublistId: "item",
                fieldId: "custcol_ada_integration_error_message",
                line: lineIndex,
                value: errorMessage,
            });
        }
        

    }
    catch(e)
    {
        log.error("Error in Updating Response on SO : "+e);
    }
  }


  function get_PBD_SmartPractice_Data(salesOrder_rec, ada_kit_item_search) {
      try {
          var PBD_ItemDetails = [];
          var PBD_salesOrder_json = {};
          var SmartPractice_ItemDetails = [];
          var SmartPractice_json = {};
          var PBD_lines = [];
          var SmartPractice_lines = [];
          var distribution_type_pbd_id = "";
          var distribution_type_smart_pratice_id = "";

          //Rashmi : Added for Tizra outbound Integration
          var Kit_Tizra_Item_List = [];
          var Tizra_json = {};


          var orderId = salesOrder_rec.getValue({
              fieldId: "tranid",
          });
          var soId = salesOrder_rec.id;
          log.debug('sales order id',soId);
          var attributeDetailsArray = getAttributeDetails(soId);
          var customer = salesOrder_rec.getText({
              fieldId: "entity",
          });
          //Rashmi : Added for Tizra Outbound Integration
          var customerId = salesOrder_rec.getValue({
              fieldId: "entity",
          });
          var date = salesOrder_rec.getValue({
              fieldId: "trandate",
          });
          var memo = salesOrder_rec.getValue({
              fieldId: "memo"
          });
          var po = salesOrder_rec.getValue({
              fieldId: "otherrefnum"
          });
          var userEmail = salesOrder_rec.getValue({
              fieldId: "custbody_ada_user_email",
          });          
          var customerid = salesOrder_rec.getValue({
              fieldId: "entity",
          });
          var internalId = salesOrder_rec.id;
          log.debug("internalId", internalId);

          var currency = salesOrder_rec.getValue({
            fieldId: "currency"
          });
          log.debug("currency",currency);

          var amsCustomerId = salesOrder_rec.getValue({
            fieldId: "custbody_ada_ams_customer_id"
          });
          log.debug("amsCustomerId",amsCustomerId);

          

        

          var fieldLookUp = search.lookupFields({
              type: "customer",
              id: customerid,
              columns: ["firstname", "lastname", "companyname", "custentity_ada_ams_customer_id"]
          });
          log.debug("customer record fields", fieldLookUp);
          var customerFirstName = fieldLookUp.firstname;
          var customerLastName = fieldLookUp.lastname;
          var customer_company_name = fieldLookUp.companyname;

          var details = getShipAndBillDetails(internalId);
          log.debug("details", details);

          //Shipping details
          var shipToAttention = details.shippingattention;
          var shipToAddressee = details.shipaddressee;
          var shipToPhone = details.shipphone;
          var shipAddressLine1 = details.shipaddress1;
          var shipAddressLine2 = details.shipaddress2;
          var shipCity = details.shipcity;
          var shipState = details.shipstate;
          var shipZipCode = details.shipzip;
          var shipCountry = details.shipcountry;
          //billing details
          var billToAttention = details.billattention;
          var billToAddresse = details.billaddressee;
          var billToPhone = details.billphone;
          var billAddressLine1 = details.billaddress1;
          var billAddressLine2 = details.billaddress2;
          var billCity = details.billcity;
          var billState = details.billstate;
          var billZipCode = details.billzip;
          var billCountry = details.billcountry;

          //Rashmi : Added for Tizra Outbound Integration
          var ams_customer_id = fieldLookUp.custentity_ada_ams_customer_id;
          var ada_employee_id = salesOrder_rec.getValue({
              fieldId: "custbody_ada_employee_id",
          });
          var shipMethod = salesOrder_rec.getText({
              fieldId: "shipmethod",
          });
          var ship_method_id = salesOrder_rec.getValue({
              fieldId: "shipmethod",
          });
          
        var itemLineCount = salesOrder_rec.getLineCount({ sublistId: "item" });
          for (var i = 0; i < itemLineCount; i++) {
              var itemType = salesOrder_rec.getSublistValue({
                  sublistId: "item",
                  fieldId: "itemtype",
                  line: i,
              });
              log.debug("itemType", itemType);
              var item = salesOrder_rec.getSublistText({
                  sublistId: "item",
                  fieldId: "item",
                  line: i,
              });
              var itemId = salesOrder_rec.getSublistValue({
                sublistId: "item",
                fieldId: "item",
                line: i,
            });
            var itemSearch = search.lookupFields({
                type: "item",
                id: itemId,
                columns: ["itemid"]
            });
            log.debug("itemSearch", itemSearch.itemid);

              var quantity = salesOrder_rec.getSublistValue({
                  sublistId: "item",
                  fieldId: "quantity",
                  line: i,
              });
              var unitprice = salesOrder_rec.getSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_ada_unit_price",
                  line: i,
              });
              var distribution_type = salesOrder_rec.getSublistText({
                  sublistId: "item",
                  fieldId: "custcol_ada_distribution_type",
                  line: i,
              });
              var rate = salesOrder_rec.getSublistValue({
                  sublistId: "item",
                  fieldId: "rate",
                  line: i,
              });
              var units = salesOrder_rec.getSublistText({
                  sublistId: "item",
                  fieldId: "units",
                  line: i,
              });
              var line = salesOrder_rec.getSublistValue({
                  sublistId: "item",
                  fieldId: "line",
                  line: i,
              });
              var smartPracticePid = salesOrder_rec.getSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_ada_smartpractice_pid",
                  line: i,
              });
              var lineUniqueKey = salesOrder_rec.getSublistText({
                  sublistId: "item",
                  fieldId: "lineuniquekey",
                  line: i,
              });

              

              if (distribution_type === "PBD") {
                  if (distribution_type_pbd_id == "") {
                      distribution_type_pbd_id = salesOrder_rec.getSublistValue({
                          sublistId: "item",
                          fieldId: "custcol_ada_distribution_type",
                          line: i,
                      });
                   }
                   PBD_lines.push(
                        salesOrder_rec.getSublistValue({
                        sublistId: "item",
                        fieldId: "line",
                        line: i,
                        })
                   );

                  PBD_ItemDetails.push({
                      line: line,
                      itemCode: itemSearch ? itemSearch.itemid : undefined,
                      unitOfMeasure: units,
                      quantity: quantity,                   
                      rate: rate                       
                  });
              } 
              else if (distribution_type === "SmartPractice")
              {
                  var externalLineId = salesOrder_rec.getSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_ada_external_line_id",
                    line: i                    
                  });
                  log.debug("Personalise Attribute : ",attributeDetailsArray);
                  log.debug("External Line Id : ",externalLineId);
                  var attributeFound = attributeDetailsArray.find((itemAttribute)=>itemAttribute.externalLineId === externalLineId);
                  log.debug("attributeFound",attributeFound);
                  if (distribution_type_smart_pratice_id == "")
                  {
                      distribution_type_smart_pratice_id = salesOrder_rec.getSublistValue({
                          sublistId: "item",
                          fieldId: "custcol_ada_distribution_type",
                          line: i,
                      });
                  }
                  SmartPractice_lines.push(
                    salesOrder_rec.getSublistValue({
                        sublistId: "item",
                        fieldId: "line",
                        line: i,
                    })
                );
                SmartPractice_ItemDetails.push({
                    line: line,
                    item: itemSearch ? itemSearch.itemid : undefined,
                    quantity: quantity,
                    rate: rate,
                    lineUniqueKey: lineUniqueKey,
                    smartPracticePid: smartPracticePid, 
                    personalizationAttributes: attributeFound ? attributeFound.itemAttributeDetails : undefined 
                });
              }//End Of Smart Practice Loop
              //else   //Rashmi : Added for Tizra Outbound Integration
              //{
              if (distribution_type === "Tizra" || itemType === "Kit") {
                  Kit_Tizra_Item_List.push(
                      salesOrder_rec.getSublistValue({
                          sublistId: "item",
                          fieldId: "item",
                          line: i,
                      })
                  )
              }
              //	}//End Of Tizra Loop
          }

          log.debug("KIT OR TIZRA LINE ITEMS", Kit_Tizra_Item_List)
          ////Creating the JSON objects based on the distribution type condtions as PBD or SmartPractice
          if (PBD_ItemDetails.length > 0) {
                var fobCode = "";
                log.debug("ship_method_id",ship_method_id);
                if(ship_method_id != null && ship_method_id != "" && ship_method_id != '')  
                    fobCode = getFobCodes(ship_method_id, distribution_type_pbd_id);
                log.debug("fobCode", fobCode);
                PBD_salesOrder_json = 
                {
                    orderFulfillment:{
                        orderId: orderId,
                        orderDate: date,
                        memo: memo,
                        poNumber: po,
                        email: userEmail,
                        shippingMethod: shipMethod,
                        fobCode: fobCode,                  
                        shipToAttention: shipToAttention,
                        shipToAddressee: shipToAddressee,
                        shipToPhone: shipToPhone,
                        shipToAddressLine1: shipAddressLine1,
                        shipToAddressLine2: shipAddressLine2,
                        shipToCity: shipCity,
                        shipToState: shipState,
                        shipToZipCode: shipZipCode,
                        shipToCountry: shipCountry[0] ? shipCountry[0].value : "",
                        billToAttention: billToAttention,
                        billToAddresse: billToAddresse,
                        billToPhone: billToPhone,
                        billToAddressLine1: billAddressLine1,
                        billToAddressLine2: billAddressLine2,
                        billToCity: billCity,
                        billToState: billState,
                        billToZipCode: billZipCode,
                        billToCountry: billCountry[0] ? billCountry[0].value : "",
                        orderFulfillmentItems: PBD_ItemDetails
                    }
                };

          }
          if (SmartPractice_ItemDetails.length > 0) 
          {
              var fobCode = "";
              log.debug("ship_method_id",ship_method_id);
              if(ship_method_id != null && ship_method_id != "" && ship_method_id != '')
                fobCode = getFobCodes(ship_method_id, distribution_type_smart_pratice_id);
              SmartPractice_json = 
              {
                smartPractice: 
                {
                  documentNumber: orderId,
                  amsCustomerId: amsCustomerId,
                  date: date,
                  shipMethodFOB: fobCode,
                  currency: currency,
                  shipToAttention: shipToAttention,
                  shipToCity: shipCity,
                  shipToState: shipState,
                  shipToZip: shipZipCode,
                  shipToCountry: shipCountry[0] ? shipCountry[0].value : "",
                  shipToAddress1: shipAddressLine1,
                  userEmail: userEmail,
                  smartPracticeItemDetails: SmartPractice_ItemDetails
                }                  
             }
          }
          if (Kit_Tizra_Item_List.length > 0)   //Rashmi : Added for Tizra Outbound Integration
          {

              Tizra_json = getTizraJSONStructure(ams_customer_id, date, Kit_Tizra_Item_List, ada_kit_item_search);

          }

          //pushing the json objects in array and returning the variable.
          var jsonObj = {
              PBD_salesOrder_json,
              SmartPractice_json,
              Tizra_json,
              PBD_lines,
              SmartPractice_lines             
          };

          return jsonObj;
      } catch (err) {
          log.error("Error message in get_PBD_SmartPractice_Data", err);
      }
  }//End Of get_PBD_SmartPractice_Data function

  
  function getTizraJSONStructure(ams_customer_id, orderDate, Kit_Tizra_Item_List, ada_kit_item_search) {
      try {
          var KIT_ItemDetails = [];
          var KIT_json = {};

          var searchObj = search.load({
              id: ada_kit_item_search
          });
          searchObj.filters.push(search.createFilter({
              name: "internalid",
              operator: search.Operator.ANYOF,
              values: Kit_Tizra_Item_List
          }));
          var tizraKITResultSet = searchObj.run().getRange({
              start: 0,
              end: 1000
          });
          log.debug("Tizra and Kit Search", tizraKITResultSet);
          for (var i = 0; i < tizraKITResultSet.length; i++) {
              var itemId = tizraKITResultSet[i].getValue({ name: "itemid" });
              var itemName = tizraKITResultSet[i].getValue({ name: "displayname" });
              var memberItemId = tizraKITResultSet[i].getText({ name: "memberitem", label: "Member Item" });
              var memberItemName = tizraKITResultSet[i].getValue({
                  name: "displayname",
                  join: "memberItem",
                  label: "Display Name"
              });
              if (memberItemId) {
                  log.debug("Inside Member Item Id Condition");
                  KIT_ItemDetails.push({
                      itemId: memberItemId,
                      itemName: memberItemName,
                  });
              }
              else {
                  KIT_ItemDetails.push({
                      itemId: itemId,
                      itemName: itemName,
                  });
              }

          }
          log.debug("ItemDetails", KIT_ItemDetails);
          KIT_json = {
              "customerId": ams_customer_id,
              "date":orderDate,
              "itemDetails": KIT_ItemDetails
          }
          return KIT_json;
      }
      catch (err) {
          log.error("Error message in getTizraJSONStructure function", err);
      }
  }

  function getFobCodes(shippingMethod, distributiontype) {
      try {
          var filters = [
              ["custrecord_ada_fob_shipping_method", "anyof", shippingMethod],
              "AND",
              ["custrecord_ada_fob_distribution_type", "anyof", distributiontype]
          ];
          log.debug("Get FOB Codes function Seach : filters", filters);
          var customSearch = search.create({
              type: "customrecord_ada_fob_shipping_code",
              filters: filters,
              columns: [
                  search.createColumn({ name: "id", sort: search.Sort.ASC, label: "ID" }),
                  search.createColumn({ name: "custrecord_ada_fob_shipping_method", label: "Shipping Method" }),
                  search.createColumn({ name: "custrecord_ada_fob_distribution_type", label: "Distribution Type" }),
                  search.createColumn({ name: "custrecord_ada_fob_code", label: "FOB Code" })
              ]
          });

          var searchResultCount = customSearch.runPaged().count;
          log.debug("fobCodesSearchObj result count", searchResultCount);
          var searchResult = customSearch.run().getRange({ start: 0, end: 1 });

          if (searchResult && searchResult.length > 0) {
              var fobValue = searchResult[0].getValue({ name: 'custrecord_ada_fob_code' });
              log.debug('FOB Code', fobValue);
              return fobValue;
          } else {
              return 'No matching record found for Shipping Method: ' + shippingMethod + ' and Distribution Type: ' + distributiontype;
          }
      } catch (e) {
          log.error('Error in getFobCodes', e.toString());
      }
  }
  function getShipAndBillDetails(internalId) {
      var customsearch = search.lookupFields({
          type: "salesorder",
          id: internalId,
          columns: ["shippingattention", "shipaddressee", "shipphone", "shipaddress1", "shipaddress2", "shipcity", "shipstate", "shipzip", "shipcountry", "billattention", "billaddressee", "billphone", "billaddress1", "billaddress2", "billcity", "billstate", "billzip", "billcountry"]
      });
      log.debug("customsearch", customsearch);
      return customsearch;
  }

  function getAttributeDetails(soId)
  {
    try{
        var customrecord_ada_personalized_attributesSearchObj = search.create({
            type: "customrecord_ada_personalized_attributes",
            filters: [
                ["custrecord_ada_pers_order", "anyof",soId]
            ],
            columns: [
                search.createColumn({ name: "custrecord_ada_pers_attribute_int_name", label: "Attribute Integration Name" }),
                search.createColumn({ name: "custrecord_ada_pers_attribute_value", label: "Attribute Value" }),
                search.createColumn({ name: "custrecord_ada_pers_item", label: "Item" }),
                search.createColumn({ name: "custrecord_ada_pers_external_line_id", sort: search.Sort.ASC, label: "External Line ID" })
            ]
        });

        var searchResultCount = customrecord_ada_personalized_attributesSearchObj.runPaged().count;
        log.debug("customrecord_ada_personalized_attributesSearchObj result count", searchResultCount);

        var detailsAttri = customrecord_ada_personalized_attributesSearchObj.run().getRange({
            start: 0,
            end: searchResultCount
        });
        log.debug("detailsAttri",detailsAttri);
        let attributeDetailsArray = []

        for (var k = 0; k < detailsAttri.length; k++) {
            var externalLineIdSearch = detailsAttri[k].getValue({
                name: "custrecord_ada_pers_external_line_id"
            });
            log.debug("externallineid", externalLineIdSearch);
            
            var attributeNameSearch = detailsAttri[k].getValue({
                name: "custrecord_ada_pers_attribute_int_name"
            });
            log.debug("attributeNameSearch", attributeNameSearch);

            var attributeValueSearch = detailsAttri[k].getValue({
                name: "custrecord_ada_pers_attribute_value"
            });
            log.debug("attributeValueSearch", attributeValueSearch);
            if(k==0)
            {
                var attributeDetail = {
                    externalLineId: externalLineIdSearch,
                    itemAttributeDetails: [{atributeName: attributeNameSearch,
                                            attributeValue: attributeValueSearch}]
                }
                attributeDetailsArray.push(attributeDetail);
            }
            else{
                log.debug("attributeDetailsArray",attributeDetailsArray);
                var attributeItemFound = attributeDetailsArray.find((itemAttribute)=>itemAttribute.externalLineId === externalLineIdSearch);
                log.debug("attributeItemFound",attributeItemFound);
                if(attributeItemFound)
                {
                    log.debug("attribute item found");
                    var index = attributeDetailsArray.indexOf(attributeItemFound);
                    log.debug("Index",index);
                    attributeDetailsArray[index].itemAttributeDetails.push({atributeName: attributeNameSearch,
                        attributeValue: attributeValueSearch});
                    log.debug("attributeDetailsArray after we found Index",attributeDetailsArray);   
                } 
                else
                {
                    var attributeDetail = {
                        externalLineId: externalLineIdSearch,
                        itemAttributeDetails: [{atributeName: attributeNameSearch,
                                                attributeValue: attributeValueSearch}]
                    }
                    attributeDetailsArray.push(attributeDetail);
                }
            }
        }
        return attributeDetailsArray;
    }catch (e) {
        log.error('Error in detailsAttri', e);
    }
}
  
  return {
      afterSubmit: afterSubmit,
  };
});