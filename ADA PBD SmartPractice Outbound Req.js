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
                            ||    Rashmi Desai       ||    5/3/2024    ||   Updated script to hit mulesoft and process the response || 
                                                                       ||   received from Smart Practice also updated PBD JSON for  ||
                                                                       ||   UOM if UOM is blank we are passing value as EA          ||                                           
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
    ) {
        function afterSubmit(context) {
            try {
                log.debug("context.type", context.type);
                const pushPbdCheck = context.newRecord.getValue("custbodyada_push_pbd_order");
                const pushSPCheck = context.newRecord.getValue("custbodyada_push_smartpractice_order");
                const pushTizraCheck = context.newRecord.getValue("custbody_ada_push_tizra_order");
                log.debug("Trigger PBD", pushPbdCheck);
                log.debug("Trigger SP", pushSPCheck);
                log.debug("Trigger Tizra", pushTizraCheck)

                //log.debug("runtime.executionContext",runtime.executionContext);

                if (((runtime.executionContext === runtime.ContextType.USER_INTERFACE|| runtime.executionContext === runtime.ContextType.CSV_IMPORT || runtime.executionContext === runtime.ContextType.CUSTOM_MASSUPDATE)  &&  context.type === context.UserEventType.CREATE) ||
                    ((context.type === context.UserEventType.EDIT || context.type === context.UserEventType.XEDIT) && (pushPbdCheck === true || pushSPCheck === true || pushTizraCheck === true))
                ) {
                    var triggerPbd = true;
                    var triggerSP = true;
                    var triggerTizra = true;
                    var newRecord = context.newRecord;
                    var recid = newRecord.id;
                    if (context.type === context.UserEventType.EDIT && pushPbdCheck != true)
                        triggerPbd = false;
                    if (context.type === context.UserEventType.EDIT && pushSPCheck != true)
                        triggerSP = false;
                    if (context.type === context.UserEventType.EDIT && pushTizraCheck != true)
                        triggerTizra = false;

                    log.debug("triggerPbd", triggerPbd);
                    log.debug("triggerSP", triggerSP);
                    log.debug("triggerTizra", triggerTizra);
                    var date = new Date();

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
                    const spIntegRecId = runtime.getCurrentScript().getParameter("custscript_sp_os_int_rec");
                    const tizraIntRecId  = runtime.getCurrentScript().getParameter("custscript_tizra_order_submit_int_rec");

                    ///Calling the function to get the JSOn objects
                    var pbd_smartPractice_function = get_PBD_SmartPractice_Data(salesOrder_rec, ada_kit_item_search);
                    
                    ///JOSN on=bject for PBD
                    if (triggerPbd === true) {
                        var PBD_jsondata = pbd_smartPractice_function.PBD_salesOrder_json;
                        var PBDjson = JSON.stringify(PBD_jsondata);
                        log.debug("PBDjson", PBDjson);
                        var PBD_line_no = pbd_smartPractice_function.PBD_lines;
                        log.debug("PBD_line_no", PBD_line_no.length);
                        if (PBD_line_no.length > 0) {
                            const response = JSON.parse(
                                connect.IntegrationConnection(PBD_jsondata, pbdIntegRecId,recid)
                            );
                            log.debug("MuleSoft Response", response.status);
                            if (response.status == 201) {
                                ///Updating the PBD lines on SO
                                for (var j = 0; j < PBD_line_no.length; j++) {

                                    var lineIndex = salesOrder_rec.findSublistLineWithValue({
                                        sublistId: "item",
                                        fieldId: "line",
                                        value: PBD_line_no[j],
                                    });
                                    log.debug("Updating PBD Lines", lineIndex);
                                    toUpdateResponseOnSO(salesOrder_rec, lineIndex, ada_order_line_status, date);
                                }
                            }
                            else {
                                var errorMessage = response.errors[0].errorCode + " : " + response.errors[0].errorMessage;
                                log.debug("Error Message", errorMessage);
                                ///Updating the PBD lines on SO
                                for (var j = 0; j < PBD_line_no.length; j++) {
                                    var lineIndex = salesOrder_rec.findSublistLineWithValue({
                                        sublistId: "item",
                                        fieldId: "line",
                                        value: PBD_line_no[j],
                                    });
                                    log.debug("Updating PBD Lines", lineIndex);
                                    toUpdateResponseOnSO(salesOrder_rec, lineIndex, ada_order_line_status_error, date, errorMessage);

                                }
                            }
                        }
                    }

                    ///JSON object for SmartPractice
                    if (triggerSP === true) {
                        var SmartPractice_jsondata = pbd_smartPractice_function.SmartPractice_json;
                        var smartPractice_json = JSON.stringify(SmartPractice_jsondata);
                        log.debug("smartPractice_json", smartPractice_json);
                        var SmartPractice_line_no = pbd_smartPractice_function.SmartPractice_lines;
                        log.debug("smartpractice_lines", SmartPractice_line_no.length);
                        if (SmartPractice_line_no.length>0) {
                            const response = JSON.parse(
                                connect.IntegrationConnection(SmartPractice_jsondata, spIntegRecId,recid)
                            );
                            log.debug("MuleSoft Response", response.status);

                            if (response.status == 200) {
                                ///Updating the Smart Practice lines on SO
                                for (var j = 0; j < SmartPractice_line_no.length; j++) {

                                    var lineIndex = salesOrder_rec.findSublistLineWithValue({
                                        sublistId: "item",
                                        fieldId: "line",
                                        value: SmartPractice_line_no[j],
                                    });
                                    log.debug("Updating Smart Practice Lines", lineIndex);
                                    toUpdateResponseOnSO(salesOrder_rec, lineIndex, ada_order_line_status, date);
                                }
                            }
                            else {
                                var errorMessage = response.errors[0].errorCode + " : " + response.errors[0].errorMessage;
                                log.debug("Error Message", errorMessage);
                                ///Updating the PBD lines on SO
                                for (var j = 0; j < SmartPractice_line_no.length; j++) {
                                    var lineIndex = salesOrder_rec.findSublistLineWithValue({
                                        sublistId: "item",
                                        fieldId: "line",
                                        value: SmartPractice_line_no[j],
                                    });
                                    log.debug("Updating Smart Practice Lines", lineIndex);
                                    toUpdateResponseOnSO(salesOrder_rec, lineIndex, ada_order_line_status_error, date, errorMessage);

                                }
                            }

                            
                        }
                    }


                    if (triggerTizra === true) {
                        var Tizra_jsondata = pbd_smartPractice_function.Tizra_json;
                        var tizra_json = JSON.stringify(Tizra_jsondata);
                        log.debug("Tizra_jsondata", Tizra_jsondata.itemDetails);
                        log.debug("tizra_json", tizra_json);
                        //log.debug("tizra_json Item Details Length", Tizra_jsondata.itemDetails.length);
                        var tizra_line_no = pbd_smartPractice_function.tizra_lines;
                        log.debug("No of Tizra Lines",tizra_line_no.length);
                        if(tizra_line_no.length > 0 || (Tizra_jsondata.itemDetails && Tizra_jsondata.itemDetails.length > 0))
                        {
                            const response = JSON.parse(
                                connect.IntegrationConnection(Tizra_jsondata, tizraIntRecId,recid)
                            );
                            log.debug("MuleSoft Response", response.status);
                            if(response.status == "Success")
                            {
                                ///Updating the Tizra lines on SO
                                for (var k = 0; k < tizra_line_no.length; k++) {

                                   log.debug("Tizra Line No",tizra_line_no[k]);

                                    var lineIndex = salesOrder_rec.findSublistLineWithValue({
                                        sublistId: "item",
                                        fieldId: "line",
                                        value: tizra_line_no[k],
                                    });
                                    log.debug("Updating Tizra Lines", lineIndex);
                                    toUpdateResponseOnSO(salesOrder_rec, lineIndex, ada_order_line_status, date);
                                }
                            }
                            else if(response.status == "Failed")
                            {
                                var errorMessage = response.errors[0].errorCode + " : " + response.errors[0].errorMessage;
                                log.debug("Error Message", errorMessage);
                                ///Updating the PBD lines on SO
                                for (var k = 0; k < tizra_line_no.length; k++) {
                                    var lineIndex = salesOrder_rec.findSublistLineWithValue({
                                        sublistId: "item",
                                        fieldId: "line",
                                        value: tizra_line_no[k],
                                    });
                                    log.debug("Updating Tizra Lines", lineIndex);
                                    toUpdateResponseOnSO(salesOrder_rec, lineIndex, ada_order_line_status_error, date, errorMessage);

                                }

                            }
                        }
                    }

                    salesOrder_rec.setValue("custbodyada_push_pbd_order", false);
                    salesOrder_rec.setValue("custbodyada_push_smartpractice_order", false);
                    salesOrder_rec.setValue("custbody_ada_push_tizra_order", false);

                    var rec = salesOrder_rec.save();
                    log.debug("rec", rec);

                    //JSON for PBD and SmartPractice lines numbers              


                }
            }
            catch (err) {
                log.error("Error In main Function", err);
                salesOrder_rec.setValue("custbodyada_push_pbd_order", false);
                    salesOrder_rec.setValue("custbodyada_push_smartpractice_order", false);
                    salesOrder_rec.setValue("custbody_ada_push_tizra_order", false);

                    var rec = salesOrder_rec.save();
                    log.debug("rec", rec);
            }
        }

        function toUpdateResponseOnSO(salesOrder_rec, lineIndex, ada_order_line_status, date, errorMessage) {
            try {

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
                if (errorMessage) {
                    salesOrder_rec.setSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_ada_integration_error_message",
                        line: lineIndex,
                        value: errorMessage,
                    });
                }


            }
            catch (e) {
                log.error("Error in Updating Response on SO : " + e);
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
                var tizra_lines = [];
                var tizra_ItemDetails = [];

                //Rashmi : Added for Tizra outbound Integration
                var Kit_Tizra_Item_List = [];
                var Tizra_json = {};


                var orderId = salesOrder_rec.getValue({
                    fieldId: "tranid",
                });
                var soId = salesOrder_rec.id;
                log.debug('sales order id', soId);
                var attributeDetailsArray = getAttributeDetails(soId);           
                
                var date = salesOrder_rec.getValue({
                    fieldId: "trandate",
                });

                var year= date.getFullYear();
                var month = date.getMonth()+1;
                var currdate = date.getDate();
                var smartPracticeShipDate = month+"/"+currdate+"/"+year;

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
                log.debug("currency", currency);

                var amsCustomerId = salesOrder_rec.getValue({
                    fieldId: "custbody_ada_ams_customer_id"
                });
                log.debug("amsCustomerId", amsCustomerId);
                                
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
                    var itemDescription = salesOrder_rec.getSublistValue({
                        sublistId: "item",
                        fieldId:"description",
                        line:i,
                    });
                    log.debug("itemDescription",itemDescription);
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
                    log.debug("quantity is",quantity);
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
                            unitOfMeasure: units? units : "EA",
                            quantity: quantity,
                            rate: rate
                        });
                    }
                    else if (distribution_type === "SmartPractice") {
                        var externalLineId = salesOrder_rec.getSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_ada_external_line_id",
                            line: i
                        });
                        log.debug("Personalise Attribute : ", attributeDetailsArray);
                        log.debug("External Line Id : ", externalLineId);
                        var attributeFound = attributeDetailsArray.find((itemAttribute) => itemAttribute.externalLineId === externalLineId);
                        log.debug("attributeFound", attributeFound);
                        if (distribution_type_smart_pratice_id == "") {
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
                            description: itemDescription,
                            quantity: quantity,
                            rate: rate,
                            lineUniqueKey: lineUniqueKey,
                            smartPracticePID: smartPracticePid,
                            personalizationAttributes: attributeFound ? attributeFound.itemAttributeDetails : undefined
                        });
                    }//End Of Smart Practice Loop
                    //else   //Rashmi : Added for Tizra Outbound Integration
                    //{
                    if (distribution_type === "Tizra" || itemType === "Kit") {
                        if(distribution_type === "Tizra"){
                            tizra_lines.push(
                                salesOrder_rec.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "line",
                                    line: i,
                                })
                            );
                        } 
                        Kit_Tizra_Item_List.push(itemId);
                    }
                    //	}//End Of Tizra Loop
                }

                log.debug("KIT OR TIZRA LINE ITEMS", Kit_Tizra_Item_List)
                ////Creating the JSON objects based on the distribution type condtions as PBD or SmartPractice
                if (PBD_ItemDetails.length > 0) {
                    var fobCode = "";
                    log.debug("ship_method_id", ship_method_id);
                    if (ship_method_id != null && ship_method_id != "" && ship_method_id != '')
                        fobCode = getFobCodes(ship_method_id, distribution_type_pbd_id);
                    log.debug("fobCode", fobCode);
                    PBD_salesOrder_json =
                    {
                        orderFulfillment: {
                            orderId: orderId,
                            orderDate: date,
                            memo: memo,
                            poNumber: po,
                            email: userEmail,
                            shippingMethod: fobCode.externalShippingName,
                            fobCode: fobCode.fobCode,
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
                if (SmartPractice_ItemDetails.length > 0) {
                    var fobCode = "";
                    log.debug("ship_method_id", ship_method_id);
                   

                    log.debug("Smart Practice Ship Date :",smartPracticeShipDate);
                    if (ship_method_id != null && ship_method_id != "" && ship_method_id != '')
                       fobCode = getFobCodes(ship_method_id, distribution_type_smart_pratice_id);
                    SmartPractice_json =
                    {
                        messageContent:
                        {
                            documentNumber: orderId,
                            amsCustomerId:amsCustomerId,
                            date:smartPracticeShipDate,
                            shipMethodFOB: fobCode.fobCode,
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

                    Tizra_json = getTizraJSONStructure(amsCustomerId, smartPracticeShipDate, Kit_Tizra_Item_List, ada_kit_item_search);

                }

                //pushing the json objects in array and returning the variable.
                var jsonObj = {
                    PBD_salesOrder_json,
                    SmartPractice_json,
                    Tizra_json,
                    PBD_lines,
                    SmartPractice_lines,
                    tizra_lines
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
                    "date": orderDate,
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
                        search.createColumn({ name: "custrecord_ada_fob_code", label: "FOB Code" }),
                        search.createColumn({name: "custrecord_ada_fob_external_carrier", label: "External Carrier"})

                    ]
                });

                var searchResultCount = customSearch.runPaged().count;
                log.debug("fobCodesSearchObj result count", searchResultCount);
                var searchResult = customSearch.run().getRange({ start: 0, end: 1 });

                if (searchResult && searchResult.length > 0) {
                    var fobValue = searchResult[0].getValue({ name: 'custrecord_ada_fob_code' });
                    log.debug('FOB Code', fobValue);
                    var externalCarrier = searchResult[0].getValue({name:'custrecord_ada_fob_external_carrier'});
                    log.debug("externalShippingCarrier",externalCarrier);
                     // Create JSON object
                    var result = {
                        fobCode: fobValue,
                        externalShippingName: externalCarrier
                    };
                    return result;
                    log.debug("result",result);
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
        function getShipAndBillDetails(internalId) {
            var customsearch = search.lookupFields({
                type: "salesorder",
                id: internalId,
                columns: ["shippingattention", "shipaddressee", "shipphone", "shipaddress1", "shipaddress2", "shipcity", "shipstate", "shipzip", "shipcountry", "billattention", "billaddressee", "billphone", "billaddress1", "billaddress2", "billcity", "billstate", "billzip", "billcountry"]
            });
            log.debug("customsearch", customsearch);
            return customsearch;
        }

        function getAttributeDetails(soId) {
            try {
                var customrecord_ada_personalized_attributesSearchObj = search.create({
                    type: "customrecord_ada_personalized_attributes",
                    filters: [
                        ["custrecord_ada_pers_order", "anyof", soId]
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
                log.debug("detailsAttri", detailsAttri);
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
                    if (k == 0) {
                        var attributeDetail = {
                            externalLineId: externalLineIdSearch,
                            itemAttributeDetails: [{
                                attributeIntegrationName: attributeNameSearch,
                                attributeValue: attributeValueSearch
                            }]
                        }
                        attributeDetailsArray.push(attributeDetail);
                    }
                    else {
                        log.debug("attributeDetailsArray", attributeDetailsArray);
                        var attributeItemFound = attributeDetailsArray.find((itemAttribute) => itemAttribute.externalLineId === externalLineIdSearch);
                        log.debug("attributeItemFound", attributeItemFound);
                        if (attributeItemFound) {
                            log.debug("attribute item found");
                            var index = attributeDetailsArray.indexOf(attributeItemFound);
                            log.debug("Index", index);
                            attributeDetailsArray[index].itemAttributeDetails.push({
                                attributeIntegrationName: attributeNameSearch,
                                attributeValue: attributeValueSearch
                            });
                            log.debug("attributeDetailsArray after we found Index", attributeDetailsArray);
                        }
                        else {
                            var attributeDetail = {
                                externalLineId: externalLineIdSearch,
                                itemAttributeDetails: [{
                                    attributeIntegrationName: attributeNameSearch,
                                    attributeValue: attributeValueSearch
                                }]
                            }
                            attributeDetailsArray.push(attributeDetail);
                        }
                    }
                }
                return attributeDetailsArray;
            } catch (e) {
                log.error('Error in detailsAttri', e);
            }
        }

        return {
            afterSubmit: afterSubmit,
        };
    });