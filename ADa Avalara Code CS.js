/*************************************************************************************************************************************
 * Script Name			:	ADA AVALARA TAX CODE 
 * Author   			:	Rama Sudhakar
 * Creation date		:	7th JUNE 2024
 * Company	  			:	Capgemini India
 * Description			:	The Avalara Customer Code exists; it generates an alert message, and if the Avalara Customer Code is not empty, it overwrites the externalid with that value.                                                                    ||
 * Change Log	  		:	||    Changed By    ||    Date    ||            Description         ||
 *****************************************************************************************************************************************************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/ui/message', 'N/ui/dialog', 'N/search'], function (record, message, dialog, search) {
    function saveRecord(context) {
        var newRecord = context.currentRecord;
        var Avalaracode = newRecord.getValue({
            fieldId: "custentity_ada_avalara_customer_code"
        });

        // If Avalaracode is empty, allow the record to be saved without further checks
        if (!Avalaracode) {
            return true;
        }

        // Create a search to find any customers with the same Avalara Customer Code
        var customerSearchObj = search.create({
            type: "customer",
            filters: [
                ["custentity_ada_avalara_customer_code", "is", Avalaracode]
            ],
            columns: [
                search.createColumn({ name: "custentity_ada_avalara_customer_code", label: "Avalara Customer Code" })
            ]
        });

        // Run the search
        var searchResultCount = customerSearchObj.runPaged().count;
        if (searchResultCount > 0) {
            // If there are any results, show an alert and return false to prevent saving
            alert("A Customer already exists with this External ID.");
            return false;
        } else {
            // If there are no results, set the external ID and return true to allow saving
           /* newRecord.setValue({
                fieldId: 'externalid',
                value: Avalaracode
            });*/
            return true;
        }
    }

    return {
        saveRecord: saveRecord
    };
});
