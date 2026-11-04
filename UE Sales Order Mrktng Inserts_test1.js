/*************************************************************************************************************************************
 * Script Name			:	ADA UE Sales Order Mrktng Inserts (customscript_ada_add_mrkt_insrt_to_so_ue)
 * Author   			:	Manthan Laad
 * Creation date		:	20th July 2023
 * Company	  			:	Capgemini India
 * Description			:	This script adds Marketing Inserts on the creation of sales order, depending on the items on the SO, by referring the Marketing Inserts Custom Record
 * Parameters           :   None
 * Deployment           :   ||      Record      ||                Deployment Id                 ||
 *                          ||      Sales Order ||   customdeploy_ada_mrkt_insrt_to_dply_ue     ||
 *                          ||                  ||                                              ||
 * Change Log	  		:	||    Changed By    ||    Date    ||            Description         ||
 *                          ||    Rama Sudhakar              ||  09/05/2024          ||     If Suppress Marketing Insert is false, the script to add marketing insert items.     ||
 *****************************************************************************************************************************************************************************************************/

/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
 define(["N/search", "N/runtime"], function (search, runtime) {
    function beforeSubmit(context) {
        try {
            log.audit("Trigger Event", context.type);
            const Record = context.newRecord;
            const sup_marketing_insert_checkbox = Record.getValue({
                fieldId: "custbody_ada_suppress_marketing_insert"
            });
            log.debug("checkbox value:",sup_marketing_insert_checkbox);
            const currentScript = runtime.getCurrentScript();
            //Get script parameter values.
            const tax_value = currentScript.getParameter({
                name: "custscript_tax_value",
            });
            if (sup_marketing_insert_checkbox == false) {
                // Getting required search filter data
                let transDate = getFormattedDate(Record.getValue("trandate"));
                let itemSublistCount = Record.getLineCount({ sublistId: "item" });
                const items = [];

                log.audit("Item Count", itemSublistCount);
                log.audit("Transaction ID", transDate);

                for (let i = 0; i < itemSublistCount; i++) {
                    let itemID = Record.getSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                        line: i,
                    });
                    items.push(itemID);
                }
                log.audit("Items on SO", items);

                // Creating Search to locate related marketing insert records
                const MarketingInsertSearch = search.create({
                    type: "customrecord_ada_marketing_insert",
                    filters: [
                        [
                            [
                                [["custrecord_ada_start_date", "onorbefore", transDate]],
                                "AND",
                                [["custrecord_ada_end_date", "onorafter", transDate]],
                            ],
                            "AND",
                            ["custrecord_ada_eligible_item", "anyof", items],
                        ],
                        "AND",
                        ["isinactive", "is", "F"],
                    ],
                    columns: [
                        search.createColumn({
                            name: "custrecord_ada_marketing_insert",
                            label: "Marketing Insert",
                        }),
                    ],
                });
                const MarketingInsertSearchCount = MarketingInsertSearch.runPaged().count;
                log.audit("Marketing Insert Record Count", MarketingInsertSearchCount);
                // Combining all marketing inserts for eligible items
                if (MarketingInsertSearchCount > 0) {
                    let MarketingInsertResults = MarketingInsertSearch.run().getRange({
                        start: 0,
                        end: MarketingInsertSearchCount,
                    });

                    let marketingInserts = new Array();
                    MarketingInsertResults.forEach(
                        (result) =>
                        (marketingInserts = [
                            ...marketingInserts,
                            ...result.getValue("custrecord_ada_marketing_insert").split(","),
                        ])
                    );
                    log.debug("Marketing Inserts Items", marketingInserts);
                    // Removing Duplicate Marketing Insert Values
                    marketingInserts = removeDuplicates(marketingInserts);
                    log.audit("Marketing Inserts to be added", marketingInserts);

                    // Add item lines for each marketing insert record
                    marketingInserts.forEach((item, i) => {
                        Record.setSublistValue({
                            line: itemSublistCount + i,
                            sublistId: "item",
                            fieldId: "item",
                            value: item,
                        });
                        Record.setSublistValue({
                            line: itemSublistCount + i,
                            sublistId: "item",
                            fieldId: "rate",
                            value: 0,
                        });
                        Record.setSublistValue({
                            line: itemSublistCount + i,
                            sublistId: "item",
                            fieldId: "amount",
                            value: 0,
                        });
                        Record.setSublistValue({
                            line: itemSublistCount + i,
                            sublistId: "item",
                            fieldId: "taxcode",
                            value: tax_value,
                        });
                    });
                }
            }
        } catch (error) {
            log.audit("Error Occurred in Before Submit UE Marketing Inserts", error);
            log.error("Error Occurred in Before Submit UE Marketing Inserts", error);
        }
    }

    // This function returns array without duplicate values
    function removeDuplicates(arr) {
        return arr.filter((item, index) => arr.indexOf(item) === index);
    }

    // This function returns string date in mm/dd/yyyy from date object
    function getFormattedDate(date) {
        var year = date.getFullYear();
        var month = (1 + date.getMonth()).toString();
        month = month.length > 1 ? month : "0" + month;
        var day = date.getDate().toString();
        day = day.length > 1 ? day : "0" + day;

        return month + "/" + day + "/" + year;
    }

    return {
        beforeSubmit: beforeSubmit,
    };
});