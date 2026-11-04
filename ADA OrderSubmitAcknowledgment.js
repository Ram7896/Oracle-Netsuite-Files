/*************************************************************************************************************************************
 * Script Name			:	ADA Inbound SP OrderAcknowledgment RL
 * Author   			:	Vaibhavi Manchala
 * Creation date		:	28th March 2024
 * Company	  			:	Capgemini India
 * Description			:	This script is for updating line-level fields of a sales order based on request received.
 * Change Log	  		:	||    Changed By         ||    Date        ||            Description                                    ||
 *                          
 *************************************************************************************************************************************/

/**
 * RestLet to OrderAcknowledgment
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(["N/record", "N/search", "N/log", "N/runtime", "./lib/Error Handling Library.js"],
    function (record, search, log, runtime, err) {
        function handleError(error, response, interfaceErrorHandling) {
            try {
                // log.error("Error message", error);
                response.message = `Error encountered: ${error.message}`;
                response.txnStatus = "FAILED";
                err.Search_ErrorHandlingInterface({
                    id: interfaceErrorHandling,
                    type: "error",
                    body: error.message,
                });
                return response;
            }
            catch (e) {
                log.error("Error in handleError Function", e);
            }
        }
        function doPut(data) {
            const response = {
                timeStamp: new Date(),
            };
            var order_line_status_IA = runtime.getCurrentScript().getParameter("custscript_order_line_status_ia");
            var order_line_status_IB = runtime.getCurrentScript().getParameter("custscript_order_line_status_ib");
            var order_line_status_ID = runtime.getCurrentScript().getParameter("custscript_order_line_status_id");
            var interfaceErrorHandling = runtime.getCurrentScript().getParameter("custscript_ada_sp_err_handling");
            log.debug("Order line status IA", order_line_status_IA);
            log.debug("Order line status IB", order_line_status_IB);
            log.debug("Order line status ID", order_line_status_ID);
            try {
                if (data.messageHeader.action === "SmartPracticeOrderAcknowledgement") {
                    var documentNumber = data.messageContent.documentNumber;
                    log.debug("documentNumber is", documentNumber);
                    var itemDetails = data.messageContent.items;
                    log.debug("itemDetails", itemDetails);
                    var errors = [];
                    if (itemDetails.length > 0) {
                        var salesorderSearchObj = search.create({
                            type: "salesorder",
                            filters:
                                [
                                    ["type", "anyof", "SalesOrd"],
                                    "AND",
                                    ["numbertext", "is", documentNumber],
                                    "AND",
                                    ["mainline", "is", "T"]
                                ],
                            columns:
                                [
                                    search.createColumn({ name: "internalid", label: "Internal ID" })
                                ]
                        });
                        var searchResultCount = salesorderSearchObj.runPaged().count;
                        log.debug("salesorderSearchObj result count", searchResultCount);
                        if (searchResultCount > 0) {
                            var results = salesorderSearchObj.run().getRange({
                                start: 0,
                                end: 1
                            });
                            var internalId = results[0].getValue({
                                name: "internalid"
                            });
                            log.debug("internal id is", internalId);
                            var salesOrder = record.load({
                                type: record.Type.SALES_ORDER,
                                id: internalId
                            });
                            log.debug("salesOrderid is successfully loaded");
                            var lineCount = salesOrder.getLineCount({
                                sublistId: "item"
                            });
                            log.debug("lineCount is", lineCount);
                            var spLineId = [];
                            for (var k = 0; k < lineCount; k++) {
                                var distributionType = salesOrder.getSublistText({
                                    sublistId: "item",
                                    fieldId: "custcol_ada_distribution_type",
                                    line: k
                                });
                                if (distributionType === "SmartPractice") {
                                    var lineId = salesOrder.getSublistValue({
                                        sublistId: "item",
                                        fieldId: "line",
                                        line: k
                                    });
                                    spLineId.push(lineId);
                                    log.debug("line is", lineId);
                                }
                            }
                            log.debug("spLineId", spLineId);
                            for (l = 0; l < itemDetails.length; l++) {
                                var foundItem = spLineId.indexOf(itemDetails[l].line);
                                log.debug("foundItem is", foundItem);
                                if (foundItem == -1) {
                                    errors.push({ errorMessage: `Line number ${itemDetails[l].line} is invalid` });
                                }
                                else {
                                    var lineIndex = salesOrder.findSublistLineWithValue({
                                        sublistId: "item",
                                        fieldId: "line",
                                        value: itemDetails[l].line,
                                    });
                                    log.debug("Updating SO Line", lineIndex);
                                    if (itemDetails[l].orderLineStatus == 'IA') {
                                        var orderlineStatus = salesOrder.setSublistValue({
                                            sublistId: "item",
                                            fieldId: "custcol_ada_order_line_status",
                                            line: lineIndex,
                                            value: order_line_status_IA
                                        });
                                        log.debug("orderlineStatus is", salesOrder.getSublistValue({
                                            sublistId: "item",
                                            fieldId: "custcol_ada_order_line_status",
                                            line: lineIndex
                                        }));
                                      /*  salesOrder.setSublistText({
                                            sublistId: "item",
                                            fieldId: "custcol_ada_integration_error_message",
                                            line: lineIndex,
                                            text: itemDetails[l].integrationErrorMessage
                                        });*/
                                    }
                                    else if (itemDetails[l].orderLineStatus == 'IB') {
                                        var orderlineStatus = salesOrder.setSublistValue({
                                            sublistId: "item",
                                            fieldId: "custcol_ada_order_line_status",
                                            line: lineIndex,
                                            value: order_line_status_IB
                                        });
                                        log.debug("orderlineStatus is", salesOrder.getSublistValue({
                                            sublistId: "item",
                                            fieldId: "custcol_ada_order_line_status",
                                            line: lineIndex
                                        }));
                                       /* salesOrder.setSublistText({
                                            sublistId: "item",
                                            fieldId: "custcol_ada_integration_error_message",
                                            line: lineIndex,
                                            text: itemDetails[l].integrationErrorMessage
                                        });*/
                                    }
                                    else if (itemDetails[l].orderLineStatus == 'ID') {
                                        var orderlineStatus = salesOrder.setSublistValue({
                                            sublistId: "item",
                                            fieldId: "custcol_ada_order_line_status",
                                            line: lineIndex,
                                            value: order_line_status_ID
                                        });
                                        log.debug("orderlineStatus is", salesOrder.getSublistValue({
                                            sublistId: "item",
                                            fieldId: "custcol_ada_order_line_status",
                                            line: lineIndex
                                        }));
                                        salesOrder.setSublistText({
                                            sublistId: "item",
                                            fieldId: "custcol_ada_integration_error_message",
                                            line: lineIndex,
                                            text: data.messageContent.integrationErrorMessage
                                        });
                                    }
                                    else {
                                        errors.push({ errorMessage: `Invalid order line status "${itemDetails[l].orderLineStatus}" for line ${itemDetails[l].line}` });
                                    }
                                }
                            }
                            salesOrder.setValue({
                                fieldId: "custbody_ada_updated_orderline_status",
                                value: true
                            });
                            var recordId = salesOrder.save();
                            if (!recordId) {
                                errors.push({ errorMessage: "Unable to Update Sales Order Lines" });
                            } else {
                                log.debug("Sales Order line-level fields got updated", recordId);
                            }
                          
                            if (errors.length > 0) {
                                let errorString = "";
                                for (let i = 0; i < errors.length; i++) {
                                    errorString += errors[i].errorMessage;
                                    if (i !== errors.length - 1) {
                                        errorString += ", ";
                                    }
                                }
                                log.debug("Constructed Error String", errorString);
                                return handleError(new Error(errorString), response, interfaceErrorHandling);
                            }
                            else {
                                response.txnStatus = "SUCCESS";
                            }
                        }
                        else {
                            handleError(new Error(`No Sales Order Found with Document Number: ${documentNumber}`), response, interfaceErrorHandling);
                        }
                    }
                }
                else {
                    handleError(new Error(`Invalid action`), response, integrationErrorMessage);
                }

            } catch (e) {
                handleError(new Error(`An unexpected error occurred`), response, interfaceErrorHandling);
            }
            return response;
        }
        return {
            put: doPut
        }
    });