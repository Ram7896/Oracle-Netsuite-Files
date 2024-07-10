/** 
*@NApiVersion 2.x
*@NScriptType ClientScript
*/
define(['N/currentRecord', 'N/search', 'N/record'],
    function (currentRecord, search, record) {
        function pageInit(context) {
            alert('entered');
        }
        function filter() {
            try {
                var newRecord = currentRecord.get();
                var customer = newRecord.getValue({
                    fieldId: 'custpage_customer'
                });
                //alert('Customer:' + customer);
                var vendors = newRecord.getValue({
                    fieldId: 'custpage_vendor'
                });
                alert('Vendor:' + vendors);
                    var transactionSearchObj = search.create({
                        type: "transaction",
                        filters:
                            [
                                ["name", "anyof", vendors,customer],
                                "AND",
                                ["type", "anyof", "CustInvc", "CustCred", "VendBill", "VendCred"],
                                "AND",
                                ["status", "anyof", "VendBill:A", "VendBill:B"],
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
                                search.createColumn({ name: "mainline", label: "*" }),
                                search.createColumn({ name: "internalid", label: "Internal Id" }),
                                search.createColumn({ name: "type", label: "Type" }),
                                search.createColumn({ name: "tranid", label: "Document Number" }),
                                search.createColumn({ name: "entity", label: "Name" }),
                                search.createColumn({ name: "account", label: "Account" }),
                                search.createColumn({ name: "memo", label: "Memo" }),
                                search.createColumn({ name: "amount", label: "Amount" })
                            ]
                    });
                    var searchresults = transactionSearchObj.run().getRange({
                        start: 0,
                        end: 1000
                    });
                    alert('Search results:' + searchresults);
                    for (var i = 0; i < searchresults.length; i++) {
                        var doc_num = searchresults[i].getValue('tranid');
                        //alert('doc num', doc_num);
                        //alert('document number get successfully', doc_num);
                        var name = searchresults[i].getText('entity');
                        //alert('name:' + name);
                        var memo = searchresults[i].getValue('memo');
                        //alert('memo:' + memo);
                        var type = searchresults[i].getValue('type');
                        //alert('type' + type);
                        var amount = searchresults[i].getValue('amount');
                        //alert('amount:' + amount);
                        var internalId = searchresults[i].getValue('internalid');
                        //alert('status:' + internalId);
                        newRecord.selectNewLine({
                            sublistId: 'custpage_results'
                        });
                        newRecord.setCurrentSublistValue({
                            sublistId: 'custpage_results',
                            fieldId: 'custpage_internalid',
                            value: internalId
                        });
                        newRecord.setCurrentSublistValue({
                            sublistId: 'custpage_results',
                            fieldId: 'custpage_name',
                            value: name
                        });
                        newRecord.setCurrentSublistValue({
                            sublistId: 'custpage_results',
                            fieldId: 'custpage_type',
                            value: type
                        });
                        newRecord.setCurrentSublistValue({
                            sublistId: 'custpage_results',
                            fieldId: 'custpage_amount',
                            value: amount
                        });
                        newRecord.setCurrentSublistValue({
                            sublistId: 'custpage_results',
                            fieldId: 'custpage_memo',
                            value: memo
                        });
                        newRecord.commitLine({
                            sublistId: 'custpage_results'
                        });
                    }
            } catch (e) {
                log.debug('Error in clientscript', e);
            }
        }
        return {
            pageInit: pageInit,
            filter: filter

        };
    }
);