/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/search', 'N/http'],
    function (ui, search, http) {

        function onRequest(context) {
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
                    form.clientScriptModulePath = 'SuiteScripts/[cs]_sal_pur_results.js';
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
            else{
                log.debug('request.parameters', request.parameters);
                var transactions = request.parameters.custpage_order_type; // get transactions 
                log.debug('orderId', transactions);
            }
        }
        return {
            onRequest: onRequest
        };
    });