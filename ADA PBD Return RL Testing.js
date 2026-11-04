/**
 * RestLet to create PBD Return Custom Record
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/runtime", "N/log"], function (record, search, runtime, log) {

    function doPost(requestBody) {
        const response = {
            timeStamp: new Date(),
        };

        try {
            log.debug("Post Request Received", requestBody);

            if (requestBody.messageHeader.action === "PBD Return") {
                const result = pbdReturn(requestBody.messageContent);
                log.debug("result is", result);
                response.status = "success";
                response.message = "PBD Return record created successfully";
            } else {
                response.status = "FAILED";
                response.message = "Action is incorrect";
            }

        } catch (e) {
            log.error("Error in doPost", e);
            response.status = "error";
            response.message = e.message;
        }

        return response;
    }

    function pbdReturn(data) {
        log.debug("Data in PBD Return Function", data);

        try {

            const customRec = record.create({
                type: 'customrecord_ada_pbd_returns',
                //isDynamic: true
            });

            const itemID = getItemInternalId(data.item);
            log.debug("Item Internal ID", itemID);

            customRec.setValue({
                fieldId: "custrecord_ada_pbdret_item",
                value: itemID
            });

            customRec.setValue({
                fieldId: "custrecord_ada_pbdret_return_number",
                value: data.returnNumber
            });

            customRec.setValue({
                fieldId: "custrecord_ada_pbdret_otherrefnum",
                value: data.otherReferenceNumber
            });

            customRec.setValue({
                fieldId: "custrecord_ada_pbdret_order_number",
                value: data.customerOrderId
            });

            customRec.setValue({
                fieldId: "custrecord_ada_pbdret_ship_to_name",
                value: data.shipToName
            });

            customRec.setValue({
                fieldId: "custrecord_ada_pbdret_quantity",
                value: data.quantity
            });

            if (data.returnDate) {
                customRec.setValue({
                    fieldId: "custrecord_ada_pbdret_return_date",
                    value: new Date(data.returnDate)
                });
            }

            var salesOrdDocNo = data.customerOrderId;
            var salesorderId = salesOrderSearch(salesOrdDocNo);
            log.debug("sales order id is", salesorderId);

            customRec.setValue({
                fieldId: "custrecord_ada_pbdret_order_num_link",
                value: salesorderId
            });

            var RtnRsn = data.returnReason
            var reasonId = getReturnCodeInternalId(RtnRsn);
            log.debug("return reason id is", reasonId);

            customRec.setValue({
                fieldId: "custrecord_ada_pbdret_return_reason",
                value: reasonId
            });

            const custRecId = customRec.save();
            log.debug("Custom Record ID", custRecId);
            return custRecId;

        } catch (e) {
            log.error("Error in pbdReturn function", e);
            throw e;
        }
    }

    function getItemInternalId(itemName) {
        log.debug("Item name from request", itemName);
        var itemList ={};
        const itemSearchObj = search.create({
            type: "item",
            filters:
                [
                    ["name", "is", itemName]
                ],
            columns: [
                search.createColumn({ name: "internalid", label: "Internal ID" }),
                search.createColumn({ name:"type", label:"Type"})
            ]
        });

        const result = itemSearchObj.run().getRange({ start: 0, end: 1 });

        if (result.length > 0) {
            itemList.push({
                internalId:result[0].getValue("internalid"),
                type:result[0].getValue("type")
            });
        } else {
            const errorMessage = "Item '" + itemName + "' not found in NetSuite.";
            log.error("Search Error", errorMessage);
            throw new Error(errorMessage);
        }
        return itemList
    }

    function salesOrderSearch(salesOrderNumber) {
        try {
            var transactionSearchObj = search.create({
                type: "transaction",
                settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
                filters: [
                    ["numbertext", "is", salesOrderNumber],
                    "AND",
                    ["mainline", "is", "T"]
                ],
                columns: [
                    search.createColumn({ name: "internalid", label: "Internal ID" })
                ]
            });

            var searchResult = transactionSearchObj.run().getRange({ start: 0, end: 1 });
            var searchResultCount = searchResult.length;

            log.debug("Transaction Search Result Count", searchResultCount);

            if (searchResultCount > 0) {
                var internalId = searchResult[0].getValue("internalid");
                log.debug("Transaction Internal ID", internalId);

                // Pass the internal ID to pbdReturn or include it in the data object
                return internalId;
            } else {
                log.debug("No transaction found for", salesOrderNumber);
                return (null);
            }

        } catch (e) {
            log.error("Error in salesOrderSearch", e);
            return pbdReturn(null);
        }
    }

    function getReturnCodeInternalId(reason) {
        var customlistSearch = search.create({
            type: "customlist_ada_pbd_return_codes",
            filters: [
                ["name", "is", reason]
            ],
            columns: [
                search.createColumn({ name: "internalid", label: "Internal ID" })
            ]
        });

        var result = customlistSearch.run().getRange({ start: 0, end: 1 });
        log.debug("results are", result);

        if (result && result.length > 0) {
            return result[0].getValue({ name: "internalid" });
        } else {
            return null;
        }
    }

    return {
        post: doPost
    };

});