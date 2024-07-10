/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/log', 'N/email', 'N/url'],
    function(serverWidget, search, record, log, email, url) {
    function onRequest(context) {
        var request = context.request;
        var response = context.response;
        
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'PO details'
            });
            form.clientScriptModulePath = './[CS]_Po details_email.js';
            
            var fromDate = form.addField({
                id: 'custpage_fromdate',
                type: serverWidget.FieldType.DATE,
                label: 'From Date'
            });
            
            var toDate = form.addField({
                id: 'custpage_todate',
                type: serverWidget.FieldType.DATE,
                label: 'To Date'
            });
            
            var Vendor = form.addField({
                id: 'custpage_vendor',
                type: serverWidget.FieldType.SELECT,
                label: 'Vendor',
                source: 'vendor'
            }).isMandatory = true;
            
            var Subsidiary = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                source: 'subsidiary'
            }).isMandatory = true;
            
            // Add sublist
            var sublist = form.addSublist({
                id: 'custpage_sublist',
                type: serverWidget.SublistType.INLINEEDITOR,
                label: 'Sublist Fields'
            });
            sublist.addField({
                id: 'custpage_sublist_checkbox',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Select'
            });
            sublist.addField({
                id: 'custpage_sublist_amount',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount'
            });
            sublist.addField({
                id: 'custpage_sublist_transaction',
                type: serverWidget.FieldType.TEXT,
                label: 'Transaction'
            });
            sublist.addField({
                id: 'custpage_sublist_item',
                type: serverWidget.FieldType.TEXT,
                label: 'Item'
            });
            sublist.addField({
                id: 'custpage_sublist_status',
                type: serverWidget.FieldType.TEXT,
                label: 'Status'
            });
            
            form.addButton({
                id: 'custpage_podetails',
                label: 'PO details',
                functionName: 'showInformation'
            });
            
            form.addSubmitButton({
                label: 'Submit'
            });
            
            context.response.writePage(form);
        }
        else if (context.request.method === 'POST') {
            var vendor = request.parameters.custpage_vendor; 
            log.debug("vendor:", vendor);

            var lineCount = context.request.getLineCount({ group: 'custpage_sublist' });
            log.debug("linecount:", lineCount);

            var checkedLines = [];
            for (var i = 0; i < lineCount; i++) {
                var isChecked = context.request.getSublistValue({
                    group: 'custpage_sublist',
                    name: 'custpage_sublist_checkbox',
                    line: i
                });

                if (isChecked === 'T') {
                    var transaction = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        name: 'custpage_sublist_transaction',
                        line: i
                    });
                    var item = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        name: 'custpage_sublist_item',
                        line: i
                    });
                    var amount = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        name: 'custpage_sublist_amount',
                        line: i
                    });
                    var status = context.request.getSublistValue({
                        group: 'custpage_sublist',
                        name: 'custpage_sublist_status',
                        line: i
                    });
                    checkedLines.push({
                        transaction: transaction,
                        item: item,
                        amount: amount,
                        status: status
                    });
                }
            }
            
            if (checkedLines.length > 0) {
                // Create email body
                var emailBody = 'The following PO details have been checked:\n\n';
                checkedLines.forEach(function(line) {
                    emailBody += 'Transaction: ' + line.transaction + '\n';
                    emailBody += 'Item: ' + line.item + '\n';
                    emailBody += 'Amount: ' + line.amount + '\n';
                    emailBody += 'Status: ' + line.status + '\n';
                    emailBody += '-------------------------------\n';
                });

                // Send email to vendor
                email.send({
                    author: 757, // -5 represents the default sender (Employee Center)
                    recipients: vendor, // Replace with the vendor's email
                    subject: 'PO Details',
                    body: emailBody
                });

                response.write('Processing complete and email sent to vendor.');
            } else {
                response.write('No lines were selected.');
            }
        }
    }
    return {
        onRequest: onRequest
    }
});
