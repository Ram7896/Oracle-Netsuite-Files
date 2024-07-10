/**

* @NApiVersion 2.x

* @NScriptType UserEventScript

*/


define(['N/record'],
    function (record) {

        function beforeSubmit(context) {

            try {

                var newRecord = context.newRecord;
                var lineCount = newRecord.getLineCount({ sublistId: 'inventory' });
                // Loop through all line items in the "Inventory" sublist
                for (var i = 0; i < lineCount; i++) {

                    //the line items and set the "Adjust Qty." field equal to the "Adjust Qty. By Value" field

                    var adjustQtyByValue = newRecord.getSublistValue({

                        sublistId: 'inventory',

                        fieldId: 'custcol_adjust',

                        line: i

                    });

                    log.debug('New negative value', adjustQtyByValue);



                    newRecord.setSublistValue({

                        sublistId: 'inventory',

                        fieldId: 'adjustqtyby',

                        line: i,

                        value: adjustQtyByValue,
                        ignoreFieldChange: true

                    });

                    log.debug('Adjustvalue seted', adjustQtyByValue);

                    var recordsublist = newRecord.getSublistSubrecord({

                        sublistId: 'inventory',

                        fieldId: 'inventorydetail',

                        line: i

                    });

                    log.debug('Entered subrecord');

                    recordsublist.setValue({

                        fieldId: 'quantity',
                        value: adjustQtyByValue
                    });

                    //log.debug('quantity',adjustQtyByValue);


                    recordsublist.setSublistValue({

                        sublistId: 'inventoryassignment',

                        fieldId: 'binnumber',
                        line: 0,
                        value: '6',
                    });
                    log.debug('entered bin');

                    recordsublist.setSublistValue({

                        sublistId: 'inventoryassignment',

                        fieldId: 'quantity',
                        line: 0,
                        value: adjustQtyByValue,
                        //ignoreFieldChange:true
                    });

                }
            }

            catch (e) {

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
