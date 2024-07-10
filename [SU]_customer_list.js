/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget'], function(serverWidget) {
    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Sample Suitelet Form'
            });

            // Add fields to the form
            form.addField({
                id: 'custpage_text',
                type: serverWidget.FieldType.TEXT,
                label: 'Text Field'
            });

            form.addField({
                id: 'custpage_checkbox',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Checkbox Field'
            });

            form.addField({
                id: 'custpage_select',
                type: serverWidget.FieldType.SELECT,
                label: 'Select Field',
                source: 'customer'
            });

            // Add sublist to the form
            var sublist = form.addSublist({
                id: 'custpage_sublist',
                type: serverWidget.SublistType.INLINEEDITOR,
                label: 'Sample Sublist'
            });

            sublist.addField({
                id: 'custpage_sublist_text',
                type: serverWidget.FieldType.TEXT,
                label: 'Text Field'
            });

            sublist.addField({
                id: 'custpage_sublist_date',
                type: serverWidget.FieldType.DATE,
                label: 'Date Field'
            });

            sublist.addField({
                id: 'custpage_sublist_float',
                type: serverWidget.FieldType.FLOAT,
                label: 'Float Field'
            });

            // Add validation to sublist field
            sublist.addField({
                id: 'custpage_sublist_amount',
                type: serverWidget.FieldType.INTEGER,
                label: 'Amount'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.NORMAL
            }).setMandatory(true);

            form.addSubmitButton({
                label: 'Submit'
            });

            context.response.writePage(form);
        } else if (context.request.method === 'POST') {
            var params = context.request.parameters;
            var submittedValues = 'Submitted Values:<br>';
            for (var param in params) {
                submittedValues += param + ': ' + params[param] + '<br>';
            }
            context.response.write(submittedValues);
        }
    }

    return {
        onRequest: onRequest
    };
});
