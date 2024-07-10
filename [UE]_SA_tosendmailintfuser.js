/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope SameAccount
*/

define(['N/record', 'N/email', 'N/runtime', 'N/search'],
    function (record, email, runtime, search) {
        function afterSubmit(context) {
            if (context.type === context.UserEventType.EDIT) {

                var newRecord = context.newRecord;
                var oldRecord = context.oldRecord;

                var salesRepId = newRecord.getValue('salesrep');
                var salesRepEmail = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: salesRepId,
                    columns: ['email']
                }).email;

                var emailSubject = 'Sales Order Modification: '; //+ newRecord.getValue('tranid');
                var emailBody = 'Hello ' + newRecord.getText('salesrep') + ',\n\n';
                emailBody += '<br><br>Sales Order ' + newRecord.getValue('tranid') + ' has been Modified.\n\n' +
                    '<br><br>Please Check Updated Details of Item Sublist<br><br>\n\n';

                var newLines = newRecord.getLineCount({ sublistId: 'item' });
                var oldLines = oldRecord.getLineCount({ sublistId: 'item' });

                emailBody += 'Below Item is Newly Added<br>\n\n';
                emailBody += '<table border="1" cellpadding="5"><tr><th>Item</th><th>Location</th><th>Quantity</th><th>Amount</th><th>Item Closed</th></tr>';


                for (var i = 0; i < newLines; i++) {

                    // Logic to extract new item line details and add to the email body
                    var oldItem = {
                        name: oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i }),
                        location: oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'location', line: i }),
                        quantity: oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }),
                        amount: oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }),
                        closed: oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'isclosed', line: i })
                    };
                    for (var j = 0; j < oldLines; j++) {
                        var newItem = {
                            name: newRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j }),
                            location: newRecord.getSublistValue({ sublistId: 'item', fieldId: 'location', line: j }),
                            quantity: newRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: j }),
                            amount: newRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: j }),
                            closed: newRecord.getSublistValue({ sublistId: 'item', fieldId: 'isclosed', line: j })
                        };
                    }
                }
                if (oldItem !== newItem) {
                    log.debug('Newly item added');
                    //emailBody += "\nBelow Item is Newly Added\n\n";
                    // Add details of the newly added item
                    emailBody += '<tr>';
                    emailBody += '<td> ' + newItem.name + '</td>';
                    emailBody += '<td>' + newItem.location + '</td>';
                    emailBody += '<td>' + newItem.quantity + '</td>';
                    emailBody += '<td>' + newItem.amount + '</td>';
                    emailBody += '</tr>';
                }
                emailBody += '</table>';
                emailBody += '<br>\nBelow Item Is Edited\n\n';
                emailBody += '<table border="1" cellpadding="5"><tr><th>Item</th><th>Location</th><th>Quantity</th><th>newAmount</th><th>oldAmount</th><th>Item Closed</th></tr>';

                for (var i = 0; i < oldLines; i++) {
                    var oldItem = {
                        name: oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i }),
                        location: oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'location', line: i }),
                        quantity: oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }),
                        amount: oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }),
                        closed: oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'isclosed', line: i })
                    };
                }
                for (var j = 0; j < newLines; j++) {
                    var newItem = {
                        name: newRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j }),
                        location: newRecord.getSublistValue({ sublistId: 'item', fieldId: 'location', line: j }),
                        quantity: newRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: j }),
                        amount: newRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: j }),
                        closed: newRecord.getSublistValue({ sublistId: 'item', fieldId: 'isclosed', line: j })
                    };
                    if (oldItem.name === newItem.name && oldItem.amount !== newItem.amount) {
                        log.debug('item els if Edited entred');
                        //emailBody += "\nBelow Item Is Edited\n\n";
                        // Add details of the edited item
                        emailBody += '<tr>';
                        emailBody += '<td>' + newItem.name + '</td>';
                        emailBody += '<td>' + newItem.location + '</td>';
                        emailBody += '<td>' + newItem.quantity + '</td>';
                        emailBody += '<td>' + oldItem.amount + '</td>';
                        emailBody += '<td>' + newItem.amount + '</td>';
                        emailBody += '</tr>';
                    }
                }
                emailBody += '</table>';


                emailBody += '<br>Below Item is Deleted\n\n';
                emailBody += '<table border="1" cellpadding="5"><tr><th>Item</th><th>Location</th><th>Quantity</th><th>Amount</th><th>Item Closed</th></tr>';


                for (var i = 0; i < oldLines; i++) {

                    var oldItem = {
                        name: oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i }),
                        location: oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'location', line: i }),
                        quantity: oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }),
                        amount: oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }),
                        closed: oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'isclosed', line: i })
                    };

                    for (var j = 0; j < newLines; j++) {
                        var newItem = {
                            name: newRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j }),
                            location: newRecord.getSublistValue({ sublistId: 'item', fieldId: 'location', line: j }),
                            quantity: newRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: j }),
                            amount: newRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: j }),
                            closed: newRecord.getSublistValue({ sublistId: 'item', fieldId: 'isclosed', line: j })
                        };
                        var itemExistsInNewRecord = false;
                        if (newItem.name === oldItem.name && newItem.location === oldItem.location && newItem.quantity === oldItem.quantity && newItem.amount === oldItem.amount && newItem.closed === oldItem.closed) {
                            itemExistsInNewRecord = true;
                            break;
                        }
                    }

                    if (!itemExistsInNewRecord) {
                        // Add details of the edited item
                        emailBody += '<tr>';
                        emailBody += '<td>' + oldItem.name + '</td>';
                        emailBody += '<td>' + oldItem.location + '</td>';
                        emailBody += '<td>' + oldItem.quantity + '</td>';
                        emailBody += '<td>' + oldItem.amount + '</td>';
                        emailBody += '<td>' + oldItem.closed + '</td>';
                        emailBody += '</tr>';

                    }
                }
                emailBody += '</table>';

                emailBody += '<br>Thanks & Regards \n\n ,<br>' + runtime.getCurrentUser().name + '\n';

                try {
                    var senderId = -5; // internal id of sender 
                    email.send({
                        author: senderId,
                        recipients: salesRepEmail,
                        subject: emailSubject,
                        body: emailBody
                    });
                    log.debug('mail sent successfully');

                } catch (e) {
                    log.error('Error sending email', e.message);
                }
            }
        }
        return {
            afterSubmit: afterSubmit
        };
    });

