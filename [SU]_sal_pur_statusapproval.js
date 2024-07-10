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
                var orderTypeField = form.addField({
                    id: 'custpage_order_type',
                    type: ui.FieldType.SELECT,
                    label: 'Select Order Type'
                });

                // Add Sales Order and Purchase Order as options
                orderTypeField.addSelectOption({
                    value: '',
                    text: ''
                });
                orderTypeField.addSelectOption({
                    value: 'SalesOrd',
                    text: 'Sales Order'
                });
                orderTypeField.addSelectOption({
                    value: 'PurchOrd',
                    text: 'Purchase Order'
                });
                form.addSubmitButton({
                    label: 'Search'
                  });
                var sublist = form.addSublist({
                    id: 'custpage_results',
                    type: ui.SublistType.LIST,
                    label: 'Results'
                });
                /*sublist.addField({
                        id: 'custpage_date',
                        type: ui.FieldType.DATE,
                        label: 'Date'
                    });*/
                    // sublist.addField({
                    //     id: 'custpage_transaction_type',
                    //     type: ui.FieldType.TEXT,
                    //     label: 'Type'
                    // });
                    var checkbox = sublist.addField({
                        id: 'custpage_checkbox',
                        type: ui.FieldType.CHECKBOX,
                        label: 'checkbox'
                    });
                    var doc=sublist.addField({
                        id: 'custpage_document_number',
                        type: ui.FieldType.TEXT,
                        label: 'Document Number'
                    });
                   // doc.defaultValue='/app/accounting/transactions/transaction.nl?id='+doc;
                    sublist.addField({
                        id: 'custpage_name',
                        type: ui.FieldType.TEXT,
                        label: 'Name'
                    });
                    var tran_number=sublist.addField({
                        id: 'custpage_internalid',
                        type: ui.FieldType.TEXT,
                        label: 'internalid'
                    });
                    var trans_field=sublist.addField({
                        id: 'custpage_transcationnumber',
                        type: ui.FieldType.TEXTAREA,
                        label: 'Transcationnumber'
                    });
                   // trans_field.linkText=transactionnumber;
                    //trans_field.linkText ='https://'+ tran_number;
                   //var transactionType = 'purchaseorder'; // Replace with the actual transaction type
                    /*var transactionURL = url.resolveRecord({
                        recordType: transactionType,
                        recordId: transcation_num,
                        isEditMode: false
                    });*/
                    //var recordLink='<a href="/app/accounting/transactions/purchord.nl?id=' +transcation_num +'"target="_blank">'+transcation_num+'/<a>';
                    //trans_field.defaultValue = recordLink;
                    /*trans_field.updateDisplayType({
                        displayType: ui.FieldDisplayType.INLINE
                    });*/
                    //trans_field.defaultValue = transactionURL;
                   // trans_field.linkText = transcation_num;
                    sublist.addField({
                        id: 'custpage_status',
                        type: ui.FieldType.TEXT,
                        label: 'Approval Status'
                    });
                    sublist.addField({
                        id: 'custpage_status_1',
                        type: ui.FieldType.TEXT,
                        label: 'approvalstatus'
                    });
                log.debug('sublist fields added sucessfully');
                log.debug('form created sucessfully');
                if (context.request.method === 'POST') {
                    // Get the form data
                    var ordertype = context.request.parameters.custpage_order_type;
                    log.debug('Order type', ordertype);
                    // Create the search
                    var transactionSearch = search.create({
                        type: search.Type.TRANSACTION,
                        filters: [
                            ["type", "anyof", ordertype],
                            "AND",
                            ["approvalstatus", "anyof", "1"],
                            "AND",
                            ["status", "anyof", "SalesOrd:A", "PurchOrd:A"],
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
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "transactionnumber", label: "Transaction Number" }),
                            search.createColumn({ name: "statusref", label: "Status" }),
                            search.createColumn({ name: "approvalstatus", label: "Approval Status" }),
                            search.createColumn({ name: "tranid", label: "Document Number" }),
                            search.createColumn({ name: "entity", label: "Name" })
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
                    var status = searchresults[i].getValue('statusref');
                    log.debug('status', status);
                    var internalId = searchresults[i].getValue('internalid');
                    log.debug('status', internalId);
                    var transactionnumber = searchresults[i].getValue('transactionnumber');
                    log.debug('Transcationnumber', transactionnumber);
                    var orderstatus = searchresults[i].getText('approvalstatus');
                        sublist.setSublistValue({
                            id: 'custpage_document_number',
                            line: i,
                            value: doc_num
                        });
                        sublist.setSublistValue({
                            id: 'custpage_name',
                            line: i,
                            value: name
                        });
                        log.debug('transcation type triggered');
                        if (!!internalId) {
                            sublist.setSublistValue({
                                id: 'custpage_internalid',
                                line: i,
                                value: internalId
                            });
                        }
                        var recordLink='https://'+runtime.accountId + '.app.netsuite.com/app/accounting/transactions/purchord.nl?id=' +internalId+'&whence=';
                        var link='<a target="_blank" href='+recordLink+'>'+transactionnumber+'</a>';
                        sublist.setSublistValue({
                            id: 'custpage_transcationnumber',
                            line: i,
                            value: link
                        });
                        //link.linkText=transactionnumber;
                        sublist.setSublistValue({
                            id: 'custpage_status',
                            line: i,
                            value: status
                        });
                        //log.debug('currency triggered');
                            sublist.setSublistValue({
                                id: 'custpage_status_1',
                                line: i,
                                value: orderstatus
                            });
                    }
                    log.debug('values set and get sucessfully');
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