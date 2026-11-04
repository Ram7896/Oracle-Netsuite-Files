/*************************************************************************************************************************************
 * Script Name			:	
 * Author   			  :	
 * Creation date		:	13th JULY 2025
 * Company	  			:	Capgemini India
 * Description			:	
 * Change Log	  		:	||    Changed By    ||    Date     ||            Description           ||
                     ||
 *************************************************************************************************************************************/
/**
 *@NApiVersion 2.1
 *@NScriptType WorkflowActionScript
 */

define(["N/record", "N/runtime", "N/search"], function (record, runtime, search) {
    function onAction(scriptContext) {
        try {
            log.debug("WFA", "Triggered");
            const testrecord = scriptContext.newRecord;
            const poId = scriptContext.newRecord.id;
            log.debug("PO Id:", poId);
            const total = testrecord.getValue({
                fieldId: 'total'
            });
            log.debug("Po Total:", total);
            var approverList = doarecordSearch();
            log.debug(" DOB Saved Search Results:", approverList);

            let selectedApprover = null;

            if (total < 500000) {
                selectedApprover = approverList.find(a => a.ApproverName === "Aarya Malviya");
            } else if (total >= 500000 && total < 1000000) {
                selectedApprover = approverList.find(a => a.ApproverName === "Amolika Bhatt");
            } else if (total >= 1000000 && total < 2000000) {
                selectedApprover = approverList.find(a => a.ApproverName === "Drishya Mishra");
            } else if (total >= 2000000) {
                selectedApprover = approverList.find(a => a.ApproverName === "Kathryn Glass");
            }

            if (selectedApprover) {
                log.debug("Selected Approver:", selectedApprover.ApproverName);
                return selectedApprover.ApproverName;
            } else {
                log.debug("No matching approver found for total:", total);
            }


        } catch (e) {
            log.error({
                title: "Error Code",
                details: e,
            });
        }
    }
    function doarecordSearch() {
        try {
            var dobarray = [];
            var customrecord_lime_doa_recordSearchObj = search.create({
                type: "customrecord_lime_doa_record",
                filters:
                    [
                        ["isinactive", "is", "F"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "name", label: "Name" }),
                        search.createColumn({ name: "custrecord_approval_req_by", label: "Approval Required By" }),
                        search.createColumn({ name: "custrecord_approval_amt_levels", label: "Approval Amount Levels" })
                    ]
            });
            var results = customrecord_lime_doa_recordSearchObj.run().getRange({ start: 0, end: 4 });
            log.debug("Results:", results);

            if (results && results.length > 0) {
                results.forEach(function (res) {
                    dobarray.push({
                        Name: res.getValue("name"),
                        ApproverName: res.getText("custrecord_approval_req_by"),
                        ApproverAmountRange: res.getValue("custrecord_approval_amt_levels")
                    });
                });
            }

            return dobarray;
        } catch (e) {
            log.debug("Error DOB Search Function:", e.message);
        }
    }
    return {
        onAction: onAction,
    };
});
