/*************************************************************************************************************************************
* Script fieldId            :   ADA BCM Cash Sale UE
* Author                    :   Rama Sudhakar
* Creation date             :   25th JULY 2024
* Company                   :   Capgemini India
* Description               :   This script first checks Aptify Order is not empty and External ID is empty,BCM Payment UUID is not empty then set External ID with the value in BCM Payment UUID.

* Change Log            :   ||    Changed By         ||    Date        ||            Description  
*************************************************************************************************************************************/
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record"],
    function (record) {
        function afterSubmit(context) {
            try {
                log.debug("context.type", context.type);
                if (context.type == context.UserEventType.CREATE) {
                    var newRecord = context.newRecord;
                    log.debug("id is", newRecord.id);
                    var aptifyOrder = newRecord.getValue({
                        fieldId: 'custbody_ada_aptify_order_number'
                    });
                    log.debug("Aptify Order Value:", aptifyOrder);
                    var externalId = newRecord.getValue({
                        fieldId: 'externalid'
                    });
                    log.debug("External Id:", externalId);
                    var bcmPaymentUUID = newRecord.getValue({
                        fieldId: 'custbody_ada_bcm_payment_uuid'
                    });
                    log.debug("BCM Payment UUID:", bcmPaymentUUID);
                    if (aptifyOrder !='' && externalId == '' && bcmPaymentUUID!='') {
                        record.submitFields({
                            type: newRecord.type,
                            id: newRecord.id,
                            values: {
                                externalid: bcmPaymentUUID
                            }
                        });
                        log.debug("External Id set successfully");
                    }
                }
            } catch (e) {
                log.error("error in afterSubmit", e);
            }
        }
        return {
            afterSubmit: afterSubmit
        }
    });