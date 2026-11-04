/*************************************************************************************************************************************
* Script fieldId			:	ADA ItemFulfillment Mulesoft Request UE
* Author   			        :	Vaibhavi Manchala
* Creation date		        :	5th March 2024
* Company	  			    :	Capgemini India
* Description			    :	This script is created to send ship notice integration details to BCM
* Change Log	  		:	||    Changed By         ||    Date        ||            Description                                ||
                            ||    Rashmi Desai       ||    3/21/2024   ||   Updated script to send JSON data to mulesoft          || 
*************************************************************************************************************************************/
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record",
        "N/runtime",
        "./lib/Integration Connection Library.js",],
function (record,runtime,connect) {
    function afterSubmit(context) {
        try {
            log.debug("context.type", context.type);                
            if (context.type == context.UserEventType.EDIT) {
                var newRecord = context.newRecord;
                log.debug("id is", newRecord.id);
                const ifIntegRecId = runtime
                    .getCurrentScript()
                    .getParameter("custscript_item_fulfillment_int_rec");
                const transactionSource = runtime.getCurrentScript().getParameter("custscript_transaction_source_field");
                log.debug("transactionSource",transactionSource);
                
                var checkBoxIsChecked = newRecord.getValue({
                    fieldId: "custbody_ada_updated_orderline_status"
                });
                var txnsrc = newRecord.getValue({
                    fieldId: "custbody_ada_transaction_source"
                });
                log.debug("txnsrc is",txnsrc);
                var date = new Date();
                var transactionDate = date.getDate();
                var transactionMonth = date.getMonth()+1;
                var transactionYear = date.getFullYear();
                var transactionTimeHour = date.getHours();
                var transactionTimeMin = date.getMinutes();
                var transactionTimeSec = date.getSeconds();
                var fullDate = transactionDate+":"+transactionMonth+":"+transactionYear+":"+transactionTimeHour+":"+transactionTimeMin+":"+transactionTimeSec;

                var corelation_id = newRecord.id+"_"+fullDate;
                log.debug("corelation_id",corelation_id);
                if(transactionSource ==txnsrc){
                if (checkBoxIsChecked) {
                    var shipNoticeJson = {            
                        "messageHeader": {
                            "correlationId": corelation_id,
                            "action": "bcmItemFulfillment",
                            "commandName": "outbound"
                        },
                        "messageContent": {
                            "externalOrderId": newRecord.getValue({ fieldId: "externalid" }),
                            "salesOrderDocumentNumber": newRecord.getValue({ fieldId: "tranid" })  
                        }
                    }
                    log.debug("shipNoticeJson",shipNoticeJson);
                    const response = JSON.parse(
                            connect.IntegrationConnection(shipNoticeJson, ifIntegRecId, newRecord.id)
                    );
                    log.debug("MuleSoft Response", response);
                }
            }
                log.debug("type is ",newRecord.type);
                var uncheckCheckBox = record.submitFields({
                    type:record.Type.SALES_ORDER,
                    id:newRecord.id,
                    values:{"custbody_ada_updated_orderline_status":false},
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields : true
                    }
                });

                log.debug("checkbox is unchecked",uncheckCheckBox);
            }
        } catch (e) {
            log.error("error in afterSubmit", e);
        }
    }
    return {
        afterSubmit: afterSubmit
    }
});