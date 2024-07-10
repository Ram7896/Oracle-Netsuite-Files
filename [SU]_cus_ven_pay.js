/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/search', 'N/http', 'N/search', 'N/task'],
    function (ui, search, http, search, task) {

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
                    form.clientScriptModulePath = 'SuiteScripts/[CS]_cus_ven_pay.js';
                    var customer = form.addField({
                        id: 'custpage_customer',
                        type: ui.FieldType.SELECT,
                        label: 'customers',
                        source: 'customer'
                    });
                    var vendor = form.addField({
                        id: 'custpage_vendor',
                        type: ui.FieldType.SELECT,
                        label: 'Vendors',
                        source: 'vendor'
                    });
                    var sublist = form.addSublist({
                        id: 'custpage_results',
                        type: ui.SublistType.INLINEEDITOR,
                        label: 'Results'
                    });
                    sublist.addField({
                        id: 'custpage_checkbox',
                        type: ui.FieldType.CHECKBOX,
                        label: 'Checkbox'
                    });
                    sublist.addField({
                        id: 'custpage_internalid',
                        type: ui.FieldType.TEXT,
                        label: 'Internal id'
                    });
                    sublist.addField({
                        id: 'custpage_type',
                        type: ui.FieldType.TEXT,
                        label: 'Type'
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
                    sublist.addField({
                        id: 'custpage_memo',
                        type: ui.FieldType.TEXT,
                        label: 'Memo'
                    });
                    form.addButton({
                        id: 'custpage_button',
                        label: 'Filter',
                        functionName: 'filter'
                    });
                    form.addSubmitButton({
                        id: 'custpage_submit',
                        label: 'Submit'
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
            else {
                log.debug('request.parameters', request.parameters);
                var customers = request.parameters.custpage_customer;
                log.debug('customerId:', customers);
                var vendors = request.parameters.custpage_vendor;
                log.debug('VendorId:', vendors);
                var fieldLookUpCustName = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: customers,
                    columns: ['companyname']
                });
                var fieldLookUpVendorname = search.lookupFields({
                    type: search.Type.VENDOR,
                    id: vendors,
                    columns: ['entityid']
                });
                var lineCount = context.request.getLineCount({
                    group: 'custpage_results'
                });
                var itemData = [];

                for (var i = 0; i < lineCount; i++) {
                    var checkMark = request.getSublistValue({
                        group: 'custpage_results',
                        name: 'custpage_checkbox',
                        line: i
                    });
                    if (checkMark == "T") {
                        var internal_Id = request.getSublistValue({
                            group: 'custpage_results',
                            name: 'custpage_internalid',
                            line: i
                        });
                        log.debug('Internalid:', internal_Id);
                        var amount = request.getSublistValue({
                            group: 'custpage_results',
                            name: 'custpage_amount',
                            line: i,
                        });
                        log.debug('Amount:', amount);
                        //alert('entered into linelevel amount field');
                        var type = request.getSublistValue({
                            group: 'custpage_results',
                            name: 'custpage_type',
                            line: i
                        });
                        log.debug('Type:', type);
                        var memo = request.getSublistValue({
                            group: 'custpage_results',
                            name: 'custpage_memo',
                            line: i
                        });
                        log.debug('memo:', memo);
                        var jsonobj = {
                            "internalid": internal_Id,
                            "amount": amount,
                            "type": type,
                            "memo": memo
                        };
                        log.debug('JSONOBJ:', jsonobj);
                        //var item=itemData.push(jsonobj);
                        var jsonString = JSON.stringify(jsonobj);
                        log.debug('JSON Stringfy:', jsonString);
                    }
                //var scriptParams={};
                //scriptParams['custscript3']=jsonString;
                var v_name = fieldLookUpVendorname.entityid;
                log.debug('vendorname:', v_name);
                var customername = fieldLookUpCustName.companyname;
                log.debug('customername:', customername);
                /*var objTask = task.create({ 
                    taskType: task.TaskType.MAP_REDUCE 
                });
                    objTask.scriptId = 'customscript_po_exp_close';
                    var scriptParams = {};
                    scriptParams['custscript3']= JSON.stringify(item);
                    objTask.params = {
                        custscript_record_type: 'Long Text',
                        custscript_record_id: 'scriptParams'
                    };
                    
                    var MRtaskId = objTask.submit();
                    log.debug('MRtaskId', MRtaskId);*/
                /*var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_po_exp_close',
                    deploymentId: 'customdeploy_po_',
                    params: {
                        custscriptcustpage_map: jsonString
                    }
                    });
                    var mrTaskId = mrTask.submit();
                    log.debug('Task value:',mrTaskId);*/
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_po_exp_close',
                    //deploymentId: 'customdeploy_po_',
                    params: {
                        custscriptcustpage_map: jsonString
                    }
                });
                var mrTaskId = mrTask.submit();
                log.debug('Task value:', mrTaskId);
            }
            }
        }
        return {
            onRequest: onRequest
        };
    });