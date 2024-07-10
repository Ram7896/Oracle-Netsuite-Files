/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/search', 'N/http','N/record'],
    function (ui, search, http,currentRecord) {

        function onRequest(context) {
            var record=context.currentRecord;
            var request = context.request;
            var response = context.response;
            if (context.request.method === 'GET') {
                try {

                    log.debug('onrequest entered');
                    // Create the form
                    var form = ui.createForm({
                        title: 'Transactions',
                        hideNavBar: false
                    });
                    form.clientScriptModulePath = 'SuiteScripts/[CS]_pur_status_pendingapproval.js';
                var orderTypeField = form.addField({
                    id: 'custpage_subsidiary',
                    type: ui.FieldType.SELECT,
                    label: 'Subsidiary',
                    source: 'subsidiary'
                });
                var purchaseOrder = form.addField({
                    id: 'custpage_purchase_order',
                    label: 'Purchase Orders',
                    type: ui.FieldType.SELECT
                });
                purchaseOrder.addSelectOption({
                    value: '',
                    text: ''
                });
                purchaseOrder.addSelectOption({
                    value: '--Select Po Number--',
                    text: '--Po Number--'
                });
                    var sublist = form.addSublist({
                        id: 'custpage_results',
                        type: ui.SublistType.INLINEEDITOR,
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
                    sublist.addField({
                        id: 'custpage_document_number',
                        type: ui.FieldType.TEXT,
                        label: 'Document Number'
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
                    log.debug('sublist fields added sucessfully');
                    // Display the form
                    context.response.writePage(form);
                    log.debug('form displayed successfully');

                }
                catch (error) {
                    log.debug('Error in suitelet', error);
                }
            }
            else if(context.request.method === 'POST'){
                
                var transactions = request.parameters.custpage_subsidiary;
                log.debug('orderId', transactions);
                var Po = request.parameters.custpage_purchase_order;
                var objRecord=record.get();
                var Iid=objRecord.getValue('internalid');
                log.debug('Internal id:',Iid);
                context.response.writePage(form);
            }
  
        }
        return {
            onRequest: onRequest
        };
    });