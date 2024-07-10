/** 
*@NApiVersion 2.x
*@NScriptType ClientScript
*/
define(['N/currentRecord', 'N/search', 'N/record'],
    function (currentRecord, search, record) {
        function pageInit(context) {
            alert('entered');
        }
        function fieldChanged(context) {
            var currentRecord = context.currentRecord;
            if (context.fieldId == 'custpage_order_type') {
                alert('transcations type entred');
                var trans = currentRecord.getValue({
                    fieldId: 'custpage_order_type'
                });
                //alert('Transcation id:' + trans);
                //alert('Transcation type saved search entred');
                var transactionSearchObj = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["type", "anyof", trans],
                            "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "ordertype",
                                sort: search.Sort.ASC,
                                label: "Order Type"
                            }),
                            //search.createColumn({ name: "trandate", label: "Date" }),
                            //search.createColumn({ name: "type", label: "Type" }),
                            search.createColumn({name: "mainline", label: "*"}),
                            search.createColumn({ name: "tranid", label: "Document Number" }),
                            search.createColumn({ name: "entity", label: "Name" }),
                            search.createColumn({ name: "amount", label: "Amount" })
                        ]
                });
                alert('saved search created successfully');
                var searchResultCount = transactionSearchObj.runPaged().count;
                alert('search result count:'+searchResultCount);
                var searchresults = transactionSearchObj.run().getRange({
                    start: 0,
                    end: 1000
                });
                log.debug('Search results:', searchresults);
                // .run().each has a limit of 4,000 results
                for (var i = 0; i < searchresults.length; i++) {
                    var doc_num = searchresults[i].getValue('tranid');
                    log.debug('doc num', doc_num);
                    //alert('document number get successfully', doc_num);
                    var name = searchresults[i].getText('entity');
                    log.debug('name', name);
                    var amount = searchresults[i].getValue('amount');
                    log.debug('amount', amount);
                    currentRecord.selectNewLine({
                        sublistId: 'custpage_results'
                    });
                    var docNum = currentRecord.setCurrentSublistValue({
                        sublistId: 'custpage_results',
                        fieldId: 'custpage_document_number',
                        value: doc_num
                    });
                    //alert('doc_num set successfully:', docNum);
                    var name_tr = currentRecord.setCurrentSublistValue({
                        sublistId: 'custpage_results',
                        fieldId: 'custpage_name',
                        value: name
                    });
                    //alert('name set successfully:', name_tr);
                    var amounts = currentRecord.setCurrentSublistValue({
                        sublistId: 'custpage_results',
                        fieldId: 'custpage_amount',
                        value: amount
                    });
                    currentRecord.commitLine({ // commit the line in sublist
                        sublistId: 'custpage_results'
                    });
                }
            }
        }
        return {
            fieldChanged: fieldChanged,
            pageInit: pageInit
        };
    }
);