/** 
 * @NApiVersion 2.x
 * @NScriptType Restlet
*/
define(['N/search', 'N/runtime', 'N/record'],
    function (search, runtime, record) {
        function _post(context) {
            var custRec = record.create({
                type: record.Type.INVENTORY_STATUS_CHANGE,
                isDynamic: true
            });
            custRec.setValue({
                fieldId: 'transactionnumber',
                value: context.transactionnumber
            });
            custRec.setValue({
                fieldId: 'location',
                value: context.location
            });
          custRec.setValue({
                fieldId: 'previousstatus',
                value: context.previousstatus
            });
            custRec.setValue({
                fieldId: 'revisedstatus',
                value: context.revisedstatus
            });
            custRec.setValue({
                fieldId: 'memo',
                value: context.memo
            });
            // Add sublist data
                log.debug("context length:",context.item);
                custRec.selectNewLine({
                    sublistId: 'inventory',
                    line:0
                });
                custRec.setCurrentSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'item',
                    line:0,
                    value: context.item // Item internal ID
                });
                custRec.setCurrentSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'quantity',
                    line:0,
                    value: context.quantity// Quantity
                });
                custRec.commitLine({
                    sublistId: 'inventory'
                });
            var cust_id = custRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            //return String(cust_id);
            return "Post Inventory Status Change Created(Id:" + cust_id + ")";
        }
        return {
            post: _post
        };
    });


/**{
		"transactionnumber":12,
        "location":"2",
        "previousstatus":"1",
        "revisedstatus":"2",
        "memo":"Demo purpose",
        "item":"409",
        "quantity":10
    } */
