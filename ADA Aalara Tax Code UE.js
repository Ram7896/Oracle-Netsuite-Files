/*************************************************************************************************************************************
 * Script Name			:	ADA AvALARA TAX CODE 
 * Author   			:	Rama Sudhakar
 * Creation date		:	6th JUNE 2024
 * Company	  			:	Capgemini India
 * Description			:	Avalara Customer Code is not empty its overwrite the externalid with that value.                                                                    ||
 * Change Log	  		:	||    Changed By    ||    Date    ||            Description         ||
 *****************************************************************************************************************************************************************************************************/
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
 define(["N/record", "N/runtime"], function (record, runtime) {
    function afterSubmit(context) {
        if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
            try {
                var newRecord = context.newRecord;
                var interntalId = newRecord.id;
                log.debug("internalId is", interntalId);
                var avalaracode = newRecord.getValue({
                    fieldId: 'custentity_ada_avalara_customer_code'
                });
                log.debug("Avalara Code value:", avalaracode);
                if (avalaracode) {
                    var id = record.submitFields({
                        type: record.Type.CUSTOMER,
                        id: interntalId,
                        values: {
                            externalid: avalaracode
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                    log.debug("externalid set successfully:", id);
                }
            }
            catch (error) {
                log.error("Error in avalara tax code:", error);
            }
        }
    }
    return {
        afterSubmit: afterSubmit,
    };
});