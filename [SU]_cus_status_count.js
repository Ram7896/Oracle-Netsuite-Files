/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/log','N/email'],
    function (ui, search, record, log,email) {

        function onRequest(context) {
            try {
                if (context.request.method === 'GET') {
                    var form = ui.createForm({
                        title: 'Custom Suitelet'
                    });
                    form.clientScriptModulePath = 'SuiteScripts/[CS]_cus_status_count.js';
                    // Add fields to the form
                    var customerField = form.addField({
                        id: 'custpag_customer',
                        type: ui.FieldType.SELECT,
                        label: 'Customer',
                        source: 'customer'
                    });
                    var dateField = form.addField({
                        id: 'custpage_date',
                        type: ui.FieldType.DATE,
                        label: 'Date'
                    });
                    var pendingFulfillmentField = form.addField({
                        id: 'pending_fulfillment',
                        type: ui.FieldType.INTEGER,
                        label: 'Pending Fulfillment'
                    });
                    var pendingBillingField = form.addField({
                        id: 'pending_billing',
                        type: ui.FieldType.INTEGER,
                        label: 'Pending Billing'
                    });
                    var billedField = form.addField({
                        id: 'billed',
                        type: ui.FieldType.INTEGER,
                        label: 'Billed'
                    });

                    // Add buttons to the form
                    form.addButton({
                        id: 'search_transaction',
                        label: 'Search Transaction',
                        functionName: 'searchTransaction'
                    });
                    form.addSubmitButton({
                        label: 'Send Email'
                    });

                    // Send response
                    context.response.writePage(form);
                }
                else { // POST request
                    var customers = context.request.parameters.custpag_customer;
                    log.debug('customerid:', customers);
                    var date = context.request.parameters.custpage_date;
                    var pendingFulfillmentCount = context.request.parameters.pending_fulfillment;
                    log.debug('pending fulfilment:', pendingFulfillmentCount);
                    var pendingBillingCount = context.request.parameters.pending_billing;
                    log.debug('pendingBillingCount:', pendingBillingCount);
                    var billedCount = context.request.parameters.billed;
                    log.debug('billedCount:', billedCount);
                    var salesRepEmail = search.lookupFields({
                        type: search.Type.CUSTOMER,
                        id: customers,
                        columns: ['email']
                    }).email;
                    log.debug('salesrepemial:',salesRepEmail);
                    var emailSubject = 'Count of Pending billing and Pending fulfillment,Billing: ';
                    var emailBody = 'Hello ' +customers + ',\n\n';
                    emailBody += 'Pending Fulfillment Count:'+pendingFulfillmentCount+'\n\n'+'Pending Billing Count:'+pendingBillingCount+'\n\n'+'Billed Count:'+billedCount+'\n\n';
                    var senderId = 1111; // internal id of sender 
                    email.send({
                        author: senderId,
                        recipients: salesRepEmail,
                        subject: emailSubject,
                        body: emailBody
                    });
                    log.debug('mail sent successfully');
                    context.response.writePage(form);
                }

            }
            catch (e) {

                log.debug("Error in suitelet:", e);
            }
        }


        return {
            onRequest: onRequest
        };

    });
