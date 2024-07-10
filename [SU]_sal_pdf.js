/**
*@NApiVersion 2.x
*@NScriptType Suitelet
*/
define(['N/ui/serverWidget', 'N/record', 'N/search','N/format','N/render'],
    function (serverWidget, record, search, format, render) {
        function onRequest(context) {
            var request = context.request;
            var response = context.response;
            if (context.request.method === 'GET') {

                var form = serverWidget.createForm({ //  create a suitelet page
                    title: 'suitelet page'
                });
                form.clientScriptModulePath = 'SuiteScripts/[CS]_Sal_pdf.js';
                var customerField = form.addField({ // add customer Field
                    id: "inpt_custpage_customer",
                    label: 'customer',
                    type: serverWidget.FieldType.SELECT,
                    source: 'customer'
                });
                customerField.isMandatory = true;
                var salesOrder = form.addField({ // add salesOrders field
                    id: 'custpage_sales_order',
                    label: 'Sales Orders',
                    type: serverWidget.FieldType.SELECT
                });
                salesOrder.isMandatory = true;
                var showInfo = form.addButton({ // add Show information button
                    id: 'custpage_show_information',
                    label: 'Show Information',
                    functionName: 'showInformation()'
                });
                var print = form.addSubmitButton({ // add print button
                    id: 'custpage_print',
                    label: 'Print',
                    functionName: 'clickOnPrint()'
                });
                var itemSublist = form.addSublist({ // add line level item field
                    id: 'custpage_items',
                    type: serverWidget.SublistType.INLINEEDITOR,
                    label: 'Items'
                });
                // itemSublist.addMarkAllButtons();
                var checkBoxField = itemSublist.addField({ // add line level checkbox field
                    id: 'custpage_checkbox',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'checkbox'
                });
                var itemField = itemSublist.addField({ // add item field
                    id: 'custpage_item',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Item',
                    source: '-10'
                });
                var quantityField = itemSublist.addField({ // add line level quantity field
                    id: 'custpage_quantity',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'Quantity'
                });
                log.debug('entered into quantityfield');
                var rateField = itemSublist.addField({ // add line level rate field
                    id: 'custpage_rate',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'rate'
                });
                var amountLineField = itemSublist.addField({ // add line level amount field
                    id: 'custpage_amountline',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Amount'
                });
                var markAll = itemSublist.addButton({ // add MarkAll button
                    id: 'custpage_markall',
                    label: 'Mark all',
                    functionName: 'markAll()'
                });
                var unMarkAll = itemSublist.addButton({ // Add UnMarkAll button
                    id: 'custpage_unmarkall',
                    label: 'Unmark all',
                    functionName: 'unmarkAll()'
                });
                response.writePage(form); 
            }
            else {
                log.debug('request.parameters', request.parameters);
                var orderId = request.parameters.custpage_sales_order; // get salesOrder id
                log.debug('orderId', orderId);
                var customerId = request.parameters.inpt_custpage_customer;//  to get the customer value
                log.debug('customerId',customerId);
                // var customer = request.parameters.inpt_custpage_customer;
                var fieldLookUpDocNo = search.lookupFields({
                    type: search.Type.SALES_ORDER,
                    id: orderId,
                    columns: ['tranid']
                });
                var fieldLookUpCustName = search.lookupFields({ // create search lookUpField to get customer
                    type: search.Type.CUSTOMER,
                    id: customerId,
                    columns: ['companyname']
                });
                log.debug('fieldLookUpCustName', fieldLookUpCustName);
                var lineCount = context.request.getLineCount({ // linecount for the items in line level
                    group: 'custpage_items'
                });

                var itemData = [];

                for (var i = 0; i < lineCount; i++) { // using for loop to calculate total amount for linelevel items
                    var checkMark = context.request.getSublistValue({
                        group: 'custpage_items',
                        name: 'custpage_checkbox',
                        line: i
                    });
                    if (checkMark == "T") {
                        var item = context.request.getSublistValue({ 
                            group: 'custpage_items',
                            name: 'custpage_item',
                            line: i
                        });
                        // var item_2 = context.request.getSublistText({ 
                        //     group: 'custpage_items',
                        //     name: 'custpage_item',
                        //     line: i
                        // });
                        // log.debug('item_2', item_2);
                        var amount = context.request.getSublistValue({ // amount of linelevel items
                            group: 'custpage_items',
                            name: 'custpage_amountline',
                            line: i,
                        });
                        alert('entered into linelevel amount field');
                        var quantity = context.request.getSublistValue({ // quantity of linelevel items
                            group: 'custpage_items',
                            name: 'custpage_quantity',
                            line: i
                        });
                        alert('entered into linelevel quantity field');
                        var rate = context.request.getSublistValue({ // rate of linelevel items
                            group: 'custpage_items',
                            name: 'custpage_rate',
                            line: i
                        });
                        var jsonobj = {           
                            "item": item,
                            "quantity": quantity,
                            "amount": amount,
                            "rate": rate
                        };

                        itemData.push(jsonobj);
                    }

                }
                var newSalesOrderId = fieldLookUpDocNo.tranid;
                log.debug('salesOrderId', newSalesOrderId);
                var currentDate = new Date();
                var currentDateString = format.format({
                    value: currentDate,
                    type: format.Type.DATE
                });

                var salesOrderData = {
                    'salesOrderNumber': newSalesOrderId,  //Sales OrderId
                    'customer': fieldLookUpCustName.companyname,    //CustomerId
                    'itemData': itemData,       //Line level Item details from the Sales Order.
                    'date': currentDateString   //Current Date
                };

                log.debug("salesOrderData", salesOrderData);
                
                var advPdf = render.create(); // creating render
                advPdf.setTemplateByScriptId("CUSTTMPL_113_T2697804_322"); // to load advance pdf template
                advPdf.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "salesOrderData",
                    data: salesOrderData
                });
                var newfile = advPdf.renderAsPdf(); // downloading the pdf
                    response.writeFile(newfile, false);

                
            }
        }
        return {
            onRequest: onRequest
        };
    }
);

