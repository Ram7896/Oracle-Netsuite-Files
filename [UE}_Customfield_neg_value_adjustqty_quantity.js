/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], function (record, log) {

    function beforeSubmit(context) {
        try {
            if (context.type === context.UserEventType.EDIT) {
                var newRecord = context.newRecord;
                var lineCount = newRecord.getLineCount({ sublistId: 'inventory' });
                for (var i = 0; i < lineCount; i++) {
                    var cust_fld = newRecord.getSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'custcol_value',
                            line: i
                        });
                        newRecord.setSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'adjustqtyby',
                            line: i,
                            value: cust_fld,
                            ignoreFieldChange: true
                        });
                    var recordsublist = newRecord.getSublistSubrecord({
                        sublistId: 'inventory',
                        fieldId: 'inventorydetail',
                        line: i
                    });
                    if (recordsublist) {
                        
                        var lineCounts = recordsublist.getLineCount({ sublistId: 'inventoryassignment' });
                        log.debug('lineCounts :', lineCounts);
                        for (var j = 0; j < lineCounts; j++) {
                            recordsublist.setValue({
                            fieldId: 'quantity',
                            value: cust_fld
                        });
                            //var halfCustCol5 = Math.abs(cust_fld / 2);
                             recordsublist.setSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'binnumber',
                            line: j,
                            value: '1',
                            ignoreFieldChange:true
                        });
                        log.debug('entered bin');
                      recordsublist.setSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'inventorystatus',
                            line: j,
                            value: '1',
                            ignoreFieldChange:true
                        });

                            recordsublist.setSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'quantity',
                                line: j,
                                value: cust_fld,
                                ignoreFieldChange: true
                            });

                            log.debug('Updated quantity for index  ', + j + ' is ' + " , " + cust_fld);
                        }
                    } else {
                        log.error('Inventory detail sublist not initialized for line: ' + i);
                    }
                }
            }
        } catch (e) {
            log.error({
                title: 'Error code',
                details: e
            });
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };
});