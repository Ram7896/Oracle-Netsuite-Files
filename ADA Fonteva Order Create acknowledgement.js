/*************************************************************************************************************************************
* Script fieldId            :   ADA ItemFulfillment Mulesoft Request UE
* Author                    :   Rama Sudhakar
* Creation date             :   11th JUNE 2024
* Company                   :   Capgemini India
* Description               :   This script is created to send Sales Order creation details to Mulesoft.
* Change Log            :   ||    Changed By         ||    Date        ||            Description                                ||
*************************************************************************************************************************************/
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record",
    "N/runtime",
    "./lib/Integration Connection Library.js",
    "N/search"],
    function (record, runtime, connect, search) {
        function afterSubmit(context) {
            try {
                log.debug("context.type", context.type);
                if (context.type == context.UserEventType.CREATE) {
                    var newRecord = context.newRecord;
                    log.debug("id is", newRecord.id);
                    var salesorderId = newRecord.id;
                    const ifIntegRecId = runtime
                        .getCurrentScript()
                        .getParameter(" custscript_fonteva_so_ack_integ_rec");
                    const transactionSource = runtime.getCurrentScript().getParameter("custscript_transaction_fnt_source_field");
                    log.debug("transactionSource", transactionSource);
                    var txnsrc = newRecord.getValue({
                        fieldId: "custbody_ada_transaction_source"
                    });
                    log.debug("Transaction Source Of Sales Order:", txnsrc);
                    var fieldLookUp = search.lookupFields({
                        type: search.Type.SALES_ORDER,
                        id: salesorderId,
                        columns: ['externalid', 'tranid', 'custbody_ada_external_transaction']
                    });
                 var extid = fieldLookUp.externalid;
                  log.debug("extid:",extid);
                    var externalId = extid[0].value;
                    log.debug("externalid:", externalId);
                    var tranid = fieldLookUp.tranid;
                    log.debug("tranid:", tranid);
                    var transactionNumber = fieldLookUp.custbody_ada_external_transaction;
                    log.debug("transactionNumber is", transactionNumber);

                    var date = new Date();
                    var transactionDate = date.getDate();
                    var transactionMonth = date.getMonth() + 1;
                    var transactionYear = date.getFullYear();
                    var transactionTimeHour = date.getHours();
                    var transactionTimeMin = date.getMinutes();
                    var transactionTimeSec = date.getSeconds();
                    var fullDate = transactionDate + ":" + transactionMonth + ":" + transactionYear + ":" + transactionTimeHour + ":" + transactionTimeMin + ":" + transactionTimeSec;

                    var corelation_id = newRecord.id + "_" + fullDate;
                    log.debug("corelation_id", corelation_id);
                    if (transactionSource == txnsrc) {
                        var shipNoticeJson = {
                            "messageHeader": {
                                "correlationId": corelation_id,
                                "action": "fontevaordercreationAcknowledgement",
                                "commandName": "outbound"
                            },
                            "messageContent": {
                                "externalOrderId": externalId,
                                "salesOrderDocumentNumber": tranid,
                                "transactionNumber": transactionNumber
                            }
                        }
                        log.debug("shipNoticeJson", shipNoticeJson);
                        /* const response = JSON.parse(
                             connect.IntegrationConnection(shipNoticeJson, ifIntegRecId, newRecord.id)
                         );
                         log.debug("MuleSoft Response", response);*/
                    }
                    log.debug("type is ", newRecord.type);
                }
            } catch (e) {
                log.error("error in afterSubmit", e);
            }
        }
        return {
            afterSubmit: afterSubmit
        }
    });