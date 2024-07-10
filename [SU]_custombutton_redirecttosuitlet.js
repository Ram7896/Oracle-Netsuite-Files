/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/log', 'N/redirect', 'N/url'],
    function (ui, search, record, log, redirect, url) {

        function onRequest(context) {
            try {
                if (context.request.method === 'GET') {
                    var internalId = context.request.parameters.custscript_id;
                    log.debug('internalid:', internalId);
                    var form = ui.createForm({
                        title: 'Are you sure you want to submit?'
                    });
                    // Add a hidden field
                    var hiddenField = form.addField({
                        id: 'custpage_hidden_field',
                        type: ui.FieldType.INTEGER,
                        label: 'Hidden Field'
                    });
                    hiddenField.defaultValue = internalId; // Set the default value instead of using setValue
                    hiddenField.updateDisplayType({
                        displayType: ui.FieldDisplayType.HIDDEN
                    });
                    form.addSubmitButton({
                        id: 'custpage_ok',
                        label: 'Ok'
                    });
                    form.addButton({
                        id: 'custpage_cancel',
                        label: 'Cancel'
                    });

                    // Send response
                    context.response.writePage(form);
                } else {
                    var internalid = context.request.parameters.custpage_hidden_field;
                    log.debug('internalid:', internalid);
                    if (internalid) {
                        // Load the Sales Order record
                        var salesOrder = record.load({
                            type: record.Type.SALES_ORDER,
                            id: internalid
                        });
                        // Populate the memo field
                        salesOrder.setValue({
                            fieldId: 'memo',
                            value: 'There is a difference in rate and amount'
                        });
                        log.debug('memo field set successfully');
                        // Save the Sales Order record
                        var salesOrderUpdatedId = salesOrder.save();
                        // Redirect to the Sales Order record
                        /*redirect.toRecord({
                            type: record.Type.SALES_ORDER,
                            id:internalid
                        });*/
                        redirect.redirect({
                            url: 'https://td2883758.app.netsuite.com/app/accounting/transactions/salesord.nl?id='+internalid+'&compid=TD2883758&whence='
                        });
                    }
                }
            } catch (e) {
                log.error("Error in suitelet:", e);
            }
        }

        

        return {
            onRequest: onRequest
        };

    });
