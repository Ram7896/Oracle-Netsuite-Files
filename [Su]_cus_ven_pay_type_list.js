/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/search', 'N/http','N/url','N/runtime','N/record'],
    function (ui, search, http,url,runtime,record) {

        function onRequest(context) {
            try {
                var record = context.currentRecord;
                var currentUser = runtime.getCurrentUser();
                log.debug('onrequest entered');
                // Create the form
                var form = ui.createForm({
                    title: 'Transactions',
                    hideNavBar: false
                });
                var customer = form.addField({
                    id: 'custpage_customer',
                    type: ui.FieldType.SELECT,
                    label: 'customers',
                    source: 'customer'
                });
                var vendor = form.addField({
                    id: 'custpage_vendor',
                    type: ui.FieldType.SELECT,
                    label: 'Vendors',
                    source: 'vendor'
                });
                form.addButton({
                    id : 'custpage_button',
                    label : 'Submit'
                });
                form.addSubmitButton({
                    label: 'Filter'
                  });
                var sublist = form.addSublist({
                    id: 'custpage_results',
                    type: ui.SublistType.LIST,
                    label: 'Results'
                });
                var checkbox = sublist.addField({
                    id: 'custpage_checkbox',
                    type: ui.FieldType.CHECKBOX,
                    label: 'checkbox'
                });
                // sublist.addField({
                //     id: 'custpage_transaction_type',
                //     type: ui.FieldType.TEXT,
                //     label: 'Type'
                // });
                sublist.addField({
                    id: 'custpage_internalid',
                    type: ui.FieldType.TEXT,
                    label: 'Internal id'
                });
                sublist.addField({
                    id: 'custpage_type',
                    type: ui.FieldType.TEXT,
                    label: 'Type'
                });
                sublist.addField({
                    id: 'custpage_name',
                    type: ui.FieldType.TEXT,
                    label: 'Name'
                });
                sublist.addField({
                    id: 'custpage_amount',
                    type: ui.FieldType.CURRENCY,
                    label: 'Amount'
                });
                sublist.addField({
                    id: 'custpage_memo',
                    type: ui.FieldType.TEXT,
                    label: 'Memo'
                });
                log.debug('sublist fields added sucessfully');
                log.debug('form created sucessfully');
                if (context.request.method === 'POST') {
                    var custr = context.request.parameters.custpage_customer;
                    log.debug('Customer', custr);
                    var vendo = context.request.parameters.custpage_vendor;
                    log.debug('Vendor', vendo);
                    // Create the search
                    var transactionSearch = search.create({
                        type: "transaction",
                            filters:
                                [
                                    ["name", "anyof", custr, vendo],
                                    "AND",
                                    ["type", "anyof", "CustInvc", "CustCred", "VendBill", "VendCred"],
                                    "AND",
                                    ["status", "anyof", "VendBill:A", "VendBill:B"],
                                    "AND",
                                    ["mainline", "is", "T"]
                                ],
                        columns: [
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
                    log.debug('filters an cloumns created sucessfully');
                    // Run the search and display the results
                    var searchresults = transactionSearch.run().getRange({
                        start: 0,
                        end: 1000
                    });
                    log.debug('Search results:', searchresults);
                    for (var i = 0; i < searchresults.length; i++) {
                        var doc_num = searchresults[i].getValue('tranid');
                        log.debug('doc num', doc_num);
                        //alert('document number get successfully', doc_num);
                        var name = searchresults[i].getText('entity');
                        log.debug('name', name);
                        var memo = searchresults[i].getValue('memo');
                        log.debug('memo', memo);
                        var amount = searchresults[i].getValue('amount');
                        log.debug('amount', amount);
                        var type = searchresults[i].getValue('type');
                        log.debug('type', type);
                        var internalId = searchresults[i].getValue('internalid');
                        log.debug('status', internalId);
                        sublist.setSublistValue({
                            id: 'custpage_internalid',
                            line: i,
                            value: internalId
                        });
                        sublist.setSublistValue({
                            id: 'custpage_name',
                            line: i,
                            value: name
                        });
                        sublist.setSublistValue({
                            id: 'custpage_type',
                            line: i,
                            value: type
                        });
                        sublist.setSublistValue({
                            id: 'custpage_amount',
                            line: i,
                            value: amount
                        });
                        //link.linkText=transactionnumber;
                        sublist.setSublistValue({
                            id: 'custpage_memo',
                            line: i,
                            value: memo
                        });
                    }
                    log.debug('values set sucessfully');
                }
                // Display the form
                context.response.writePage(form);
                log.debug('form displayed successfully');

            }
            catch (error) {
                log.debug('Error in suitelet', error);
            }
        }
        return {
            onRequest: onRequest
        };
    });