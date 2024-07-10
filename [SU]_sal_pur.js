/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/http'],
    function (ui, search, http) {
        function onRequest(context) {
            if (context.request.method === 'GET') {
                // Create a form
                var form = serverWidget.createForm({
                    title: 'Search Orders'
                });

                // Add a field to select "Sales Order" or "Purchase Order"
                var orderTypeField = form.addField({
                    id: 'custpage_ordertype',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Order Type'
                });
                orderTypeField.addSelectOption({
                    value: 'sales',
                    text: 'Sales Order'
                });
                orderTypeField.addSelectOption({
                    value: 'purchase',
                    text: 'Purchase Order'
                });

                // Add a submit button
                form.addSubmitButton({
                    label: 'Search'
                });

                // Add a tab to display results
                var tab = form.addTab({
                    id: 'custpage_results_tab',
                    label: 'Results'
                });

                // Add a sublist for Sales Orders
                var salesOrderSublist = form.addSublist({
                    id: 'custpage_sales_orders',
                    type: serverWidget.SublistType.LIST,
                    label: 'Sales Orders',
                    tab: 'custpage_results_tab'
                });
                salesOrderSublist.addField({
                    id: 'custpage_so_field',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Sales Order Field'
                });

                // Add a sublist for Purchase Orders
                var purchaseOrderSublist = form.addSublist({
                    id: 'custpage_purchase_orders',
                    type: serverWidget.SublistType.LIST,
                    label: 'Purchase Orders',
                    tab: 'custpage_results_tab'
                });
                purchaseOrderSublist.addField({
                    id: 'custpage_po_field',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Purchase Order Field'
                });

                // Send the form as a response
                context.response.writePage(form);
            } else {
                // Handle form submission
                var orderType = context.request.parameters.custpage_ordertype;

                // Depending on the selected option, you can perform searches and populate sublists here
                if (orderType === 'sales') {
                    // Perform a sales order search and populate the salesOrderSublist
                } else if (orderType === 'purchase') {
                    // Perform a purchase order search and populate the purchaseOrderSublist
                }
            }
        }
        return {
            onRequest: onRequest
        };
    });
