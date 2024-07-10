/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/format', 'N/record', 'N/runtime', 'N/search', 'N/url', 'N/currentRecord', 'N/email'],
    function (format, record, runtime, search, url, currentRecord, email) {
        function fieldChanged(scriptContext) {
            try {
                var curRec = scriptContext.currentRecord;
                if (scriptContext.fieldId == 'custpage_vendor_name') {
                    var recVendor = curRec.getValue('custpage_vendor_name');
                    alert('Vendor is selected');
                    var recobj = search.lookupFields({
                        type: 'vendor',
                        id: recVendor,
                        columns: ['subsidiary']
                    });
                    alert(JSON.stringify(recobj));
                    var subId = recobj.subsidiary[0].value;
                    curRec.setValue({
                        fieldId: 'custpage_subsidiary',
                        value: subId,
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });
                }
            } catch (error) {
                log.error('ERROR', error.toString());
            }
            return true;
        }
        function sendEmail() {
            alert('send email entred');
            var selectedTransactions = [];
            // Iterate through the sublist and get the selected transactions
            var rec = currentRecord.get();
            var numLines = rec.getLineCount({ sublistId: 'custpage_results' });
            alert('Line Count' + numLines);
            for (var i = 0; i < numLines; i++) {
                var apply = rec.getSublistValue({
                    sublistId: 'custpage_results',
                    fieldId: 'custpage_apply',
                    line: i
                });
                alert('apply entred' + apply);
                if (apply == true || apply == 'T') {
                    var document_num = rec.getSublistValue({
                        sublistId: 'custpage_results',
                        fieldId: 'custpage_document_number',
                        line: i
                    });
                    var document_status = rec.getSublistValue({
                        sublistId: 'custpage_results',
                        fieldId: 'custpage_document_status',
                        line: i
                    });
                    selectedTransactions.push({
                        doc_num: document_num,
                        doc_stat: document_status
                    });
                    alert('values pushed successfully' + selectedTransactions);
                    alert('email trans entered');
                    var trans = selectedTransactions[i];
                    var body = 'PO number:' + trans.doc_num + '\n\n' + 'Document Status:' + trans.doc_stat;
                    email.send({
                        author: -5, // Set to the internal ID of the employee sending the email
                        recipients: 'medapati-rama-sudhakar.reddy@capgemini.com',
                        subject: 'Selected Vendor Transactions',
                        body: body
                    });
                }
            }
            alert('email send successfully');
        }
        return {
            fieldChanged: fieldChanged,
            sendEmail: sendEmail
        };
    });

