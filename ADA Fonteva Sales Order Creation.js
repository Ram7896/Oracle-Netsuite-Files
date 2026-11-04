/*************************************************************************************************************************************
 * Script Name			:	ADA Fonteva Sales Order Creation
 * Author   			:	Manchala, Vaibhavi
 * Creation date		:	5th June 2024
 * Company	  			:	Capgemini India
 * Description			:	This script is used to create a sales order for Fonteva on NetSuite.
 * Deployment           :   ||         Record                 ||         Deployment Id            ||
 *                          ||ADA Fonteva Sales Order Creation|| customdeploy_fonteva_so_creation ||
 *                          ||                  ||                                              ||
 * Change Log	  		:	||    Changed By    ||    Date    ||            Description         ||
 
 *****************************************************************************************************************************************************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/file', 'N/search', "N/task", 'N/log', 'N/record', "N/runtime", "./lib/ADA Creating Customer and Customer Search.js", "./lib/Error Handling Library.js"],
    function (file, search, task, log, record, runtime, customers, errorLib) {

        function getInputData() {
            try {
                const currentscriptpara = runtime.getCurrentScript();
                var folderId = currentscriptpara.getParameter({
                    name: "custscript_ada_folder_id",
                });
                log.debug("folderId is", folderId);
                var fileSearch = search.create({
                    type: "file",
                    filters: [
                        ["folder", "anyof", folderId]
                    ],
                    columns: ['internalid']
                });
                var fileSearchResult = fileSearch.run().getRange({
                    start: 0,
                    end: 1000
                });
                return fileSearchResult;
            } catch (e) {
                log.error({
                    title: 'Error in getinputdata',
                    details: e
                });
            }
        }

        function map(context) {
            try {
                //log.debug("Context:", context);
                var fileId = JSON.parse(context.value);
                log.debug("FIle Id:", fileId);
                var file_internalid = fileId.id;
                var fileObj = file.load({
                    id: file_internalid
                });
                var fileContents = fileObj.getContents();
                //log.debug("fileContents:", fileContents);
                var splitcells = fileContents.split('\n');
                //log.debug("split", splitcells);
                //log.audit("split length", splitcells.length);
                for (var i = 1; i < splitcells.length - 1; i++) {
                    var cells = splitcells[i].split(',').map(cell => cell.trim());
                    log.debug("Cells:", cells);
                    context.write({
                        key: cells[9],
                        value: cells
                    });
                }
                var scriptObj = runtime.getCurrentScript();
                var processedFolder = scriptObj.getParameter({ name: "custscript_ada_processed_folder_id" });
                var fileName = fileObj.name;

                var newFile = file.create({
                    name: fileName,
                    fileType: file.Type.CSV,
                    contents: fileContents,
                    folder: processedFolder
                });
                var newFileID = newFile.save();
                log.debug("New file created and saved with ID:", newFileID);

                file.delete({
                    id: fileId.id
                });
                log.debug("file has been deleted");

            } catch (e) {
                log.debug("Error in Map:", e);
            }
        }

        function reduce(context) {
            log.debug("context.key", context.values);
            //log.debug("context.value",context.value);
            var salesOrderJSON = {};
            for (var i = 0; i < context.values.length; i++) {
                var output = JSON.parse(context.values[i]);
                log.debug("Reduce output:",output.length);            
                if (i == 0) {
                    salesOrderJSON = toBuildSOJSON(output);
                    //log.debug("Sales Order JSON for I==0",salesOrderJSON);
                }
                else {
                    salesOrderJSON = toBuildSOJSON(output, salesOrderJSON);
                    //log.debug("Sales Order JSON for I<>0",salesOrderJSON);

                }

            }
            log.debug("Sales Order JSON", salesOrderJSON);
            
            if(salesOrderJSON)
                {
                    log.debug("Sales Order JSON", salesOrderJSON.amsCustomerId);
                    if(salesOrderJSON.amsCustomerId)
                        {
                            let customerSerachJSON = customers.customerSrch(salesOrderJSON.amsCustomerId, salesOrderJSON);
                            log.debug("Customer Id", customerSerachJSON);
                            if (customerSerachJSON.customer_internalId != "") {
                                log.debug("Customer is created or Serched successfully");
                                let soJSON = soCreation(customerSerachJSON.customer_internalId, salesOrderJSON);
                                if (soJSON.so_internalId == "") {
                                    context.write({
                                        key: salesOrderJSON.ExternalID,
                                        value: {
                                            "Error": soJSON.Error,
                                            "ErrorMessage": soJSON.ErrorMessage,
                                            "ExternalTransaction": salesOrderJSON.ExternalTransaction
                                        }
                                    })
                               }
                            }
                            else {
                                log.debug("Customer creation or Serching is error out");
                                context.write({
                                    key: salesOrderJSON.ExternalID,
                                    value: {
                                        "Error": customerSerachJSON.Error,
                                        "ErrorMessage": customerSerachJSON.ErrorMessage,
                                        "ExternalTransaction": salesOrderJSON.ExternalTransaction
                                    }
        
                                })
                            }
                        }
                        else{
                            log.debug("ExternalID",salesOrderJSON.ExternalID);
                            context.write({
                                key: salesOrderJSON.ExternalID,
                                value: {
                                    "Error":"Customer Id is not provided in file.",
                                    "ErrorMessage": "Customer Details are missing.",
                                    "ExternalTransaction": salesOrderJSON.ExternalTransaction,
                                }
        
                            })
        
                        }   
                }
             


        }

        function summarize(context) {
            log.audit({
                title: 'Final Output',
                details: context
            });

            var inteface_error_handling_id = runtime
                .getCurrentScript()
                .getParameter("custscript_ada_fonteva_socreation_err_ha");
            log.debug("inteface_error_handling_id", inteface_error_handling_id);

            var errorFolder = runtime.getCurrentScript().getParameter("custscript_error_file_folder");
            log.debug("Error Folder Id", errorFolder);

            var errorFileContent = 'External Id,External Transaction No,Error Code,ErrorMessage \n';
            var noOfRows = 0;

            context.output.iterator().each(function (key, values) {
                noOfRows++;
                var errorCode = JSON.parse(values);
                log.debug("errorCode", errorCode),
                    errorFileContent += (key + ' , ' + errorCode.ExternalTransaction + ',' + errorCode.Error + ',"' + errorCode.ErrorMessage + '" \n');
                return true;
            });
            log.debug("Error File Content data", errorFileContent);
            if (noOfRows > 0) {
                //Creating Error File
                log.debug("Current Date", new Date());
                log.debug("Converted Current Date", getFormattedDate(new Date()));
                var fileObj = file.create({
                    name: 'Error_Fonteva_SalesOrder_Creation_'+new Date()+'.csv',
                    fileType: file.Type.CSV,
                    contents: errorFileContent
                });

                fileObj.folder = errorFolder;///SCRIPTPARAMETER
                var fileId = fileObj.save();

                log.audit({
                    title: 'Id of new file record',
                    details: fileId
                });
                errorLib.Search_ErrorHandlingInterface({
                    id: inteface_error_handling_id,
                    type: "error",
                    body:
                        "Please find attached Error File generated while processing Fonteva Sales Orders.",
                    attachments: [fileObj],
                });
            }
            var mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_ada_fnt_payment",
                // deploymentId: 'customdeploy_test_mapreduce_script'
            });

            var mrTaskId = mrTask.submit();
            log.debug("task created", mrTaskId);
        }

        function soCreation(customerId, salesOrderJSON) {
            try {
                const parameterObj = runtime.getCurrentScript();
                const sales_order_form_id = parameterObj.getParameter({
                    name: "custscript_ada_salesorder_form"
                });
                var so_Rec = record.create({
                    type: record.Type.SALES_ORDER,
                    defaultValues: {
                        customform: sales_order_form_id,
                    },
                    isDynamic: true,
                });

                so_Rec.setValue({
                    fieldId: 'entity',
                    value: customerId
                });
                so_Rec.setValue({
                    fieldId: 'externalid',
                    value: salesOrderJSON.ExternalID
                });
                so_Rec.setValue({
                    fieldId: 'custbody_ada_external_transaction',
                    value: salesOrderJSON.ExternalTransaction
                });

                so_Rec.setValue({
                    fieldId:"custbody_ada_company_id",
                    value:salesOrderJSON.soCompanyId
                });

                so_Rec.setValue({
                    fieldId:"custbody_ada_company_name",
                    value:salesOrderJSON.soCompanyName
                });

                var order_date_format = getFormattedDate(salesOrderJSON.Date);
                log.audit("order_date_format", order_date_format);
                so_Rec.setValue({
                    fieldId: "trandate",
                    value: new Date(order_date_format)
                });
                so_Rec.setValue({
                    fieldId: "memo",
                    value: salesOrderJSON.Memo
                });

                so_Rec.setValue({
                    fieldId: "custbody_ada_user_email",
                    value: salesOrderJSON.userEmail
                });

                so_Rec.setValue({
                    fieldId: "custbody_ada_order_source",
                    value: salesOrderJSON.ordersource
                });
                so_Rec.setText({
                    fieldId: "shipcarrier",
                    value: "More",
                });

                so_Rec.setValue({
                    fieldId: "custbody_ada_employee_id",
                    value: salesOrderJSON.EmployeeID
                });
                
                so_Rec.setValue({
                    fieldId: "custbody_ava_disable_tax_calculation",
                    value: true,
                  });

                so_Rec.setValue({
                    fieldId: "custbody_ada_transaction_source",
                    value: salesOrderJSON.transaction_source_id
                });

                so_Rec.setValue({
                    fieldId: "currencyname",
                    value: salesOrderJSON.sales_order_currency
                });

                so_Rec.setValue({
                    fieldId: "subsidiary",
                    value: salesOrderJSON.customer_subsidiary
                });

                so_Rec = buildSubRecord(true, so_Rec, salesOrderJSON.BillToAttention, salesOrderJSON.BillAddress1,
                    salesOrderJSON.BillCity, salesOrderJSON.BillState, salesOrderJSON.BillCountry,
                    salesOrderJSON.BillZip);

                so_Rec = buildSubRecord(false, so_Rec, salesOrderJSON.ShipToAttention, salesOrderJSON.ShipAddress1,
                    salesOrderJSON.ShipCity, salesOrderJSON.ShipvState, salesOrderJSON.ShipCountry,
                    salesOrderJSON.ShipZip);

                var lineitemdetails = salesOrderJSON.itemDetails;
                log.debug("line item Details:", lineitemdetails);

                var taxTotal = 0;

                //item filter
                const itemNameFilter = [];
                const itemCount = lineitemdetails.length;
                lineitemdetails.forEach((element, i) => {
                    if (element.IsTax != 'T') {
                        log.debug("iteration of i", i);
                        log.debug("Item Name", element.ItemName);
                        if (i === itemCount - 1) {
                            itemNameFilter.push(["name", "is", element.ItemName]);
                        } else {
                            itemNameFilter.push(["name", "is", element.ItemName]);
                            itemNameFilter.push("OR");
                        }
                    }
                    else {
                        if (i === itemCount - 1)
                            itemNameFilter.pop();
                        taxTotal = Number(taxTotal) + Number(element.Taxamount);
                    }
                });

                const itemSearchObj = search.create({
                    type: "item",
                    filters: itemNameFilter,
                    columns: [
                        { name: "internalid" },
                        search.createColumn({
                            name: "itemid",
                            label: "Name",
                        }),
                    ],
                });
                log.debug("Item Filter Array", itemNameFilter);
                const itemSearchCount = itemSearchObj.runPaged().count;
                log.audit(`Search Result count of items`, itemSearchCount);
                //const soItems = [];
                if (itemSearchCount === 0) {
                    throw new Error("Item not Found, Product not present in netsuite.");
                }
                itemSearchObj.run().each(function (result, i) {
                    let itemId = result.getValue("itemid");
                    log.debug('ItemId:', itemId);
                    let foundItems = lineitemdetails.filter((item) => item.ItemName === itemId);
                    if (foundItems.length > 0) {
                        foundItems.forEach((item) => {
                            item.nsInternalId = result.getValue("internalid");
                        });
                    }
                    else {
                        log.audit(`Item ${itemId} not found!!!`);
                    }
                    return true;
                });

                //itemfilter search ends

                log.audit("Item obj", lineitemdetails);


                for (var i = 0; i < lineitemdetails.length; i++) {

                    if (lineitemdetails[i].IsTax != 'T') {
                        so_Rec.selectNewLine({
                            sublistId: 'item'
                        });
                        if (lineitemdetails[i].nsInternalId)
                            so_Rec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                value: lineitemdetails[i].nsInternalId
                            });
                        else {
                            throw new Error("Item/Product " + lineitemdetails[i].ItemName + " not present in netsuite.");
                        }
                        so_Rec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_ada_external_line_id",
                            value: lineitemdetails[i].ExternalLineID,
                        });
                        so_Rec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "quantity",
                            value: lineitemdetails[i].Quantity,
                        });
                        so_Rec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_ada_unit_price",
                            value: lineitemdetails[i].UnitPrice,
                        });
                        so_Rec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "rate",
                            value: lineitemdetails[i].Rate,
                        })
                        so_Rec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "amount",
                            value: lineitemdetails[i].Amount,
                        });
                        so_Rec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_ada_tax_amount",
                            value: lineitemdetails[i].Taxamount
                        });
                        so_Rec.commitLine({
                            sublistId: 'item'
                        });
                    }

                }

                if (taxTotal > 0) {
                    log.debug("Tax entred", i);
                    so_Rec.selectNewLine({
                        sublistId: 'item'
                    });
                    //Adding tax item Line
                    so_Rec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                        value: salesOrderJSON.tax_item,
                    });
                    log.debug("item set successfully");
                    so_Rec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        value: 1,
                    });
                    log.debug("quantity set successfully");
                    so_Rec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "rate",
                        value: taxTotal,
                    });
                    so_Rec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "amount",
                        value: taxTotal,
                    });
                    so_Rec.commitLine({
                        sublistId: "item",
                    });
                }
                log.debug("Final SO_Rec before Save", so_Rec);

                var soRecordId = so_Rec.save({
                    ignoreMandatoryFields: true,
                    enableSourcing: false
                });
                log.debug("SO recordId", soRecordId);
                return { "so_internalId": soRecordId };

            }
            catch (error) {
                log.error("Error in SO creation Function", error);
                return {
                    "so_internalId": "",
                    "Error": "Error creating Sales Order",
                    "ErrorMessage": error.message
                };
            }
        }

        //Creating Billing and Shipping Sub Record
        function buildSubRecord(isBilling, so_Rec, attention, address1, city, state, country, zip) {
            try {
                var subRec;
                // Create the subrecord.
                if (isBilling == true) {
                    log.debug("isBilling", isBilling);
                    subRec = so_Rec.getSubrecord({
                        fieldId: "billingaddress",
                    });
                }
                else {
                    subRec = so_Rec.getSubrecord({
                        fieldId: "shippingaddress",
                    });
                }
                // Set values on the subrecord.
                subRec.setValue({
                    fieldId: "attention",
                    value: attention,
                });
                subRec.setValue({
                    fieldId: "addr1",
                    value: address1,
                });
                subRec.setValue({
                    fieldId: "city",
                    value: city,
                });
                subRec.setValue({
                    fieldId: "state",
                    value: state,
                });
                subRec.setValue({
                    fieldId: "zip",
                    value: zip,
                });
                subRec.setValue({
                    fieldId: "country",
                    value: country,
                });

                return so_Rec;

            }
            catch (e) {
                log.error("Error is building Shipping and Billing Sub Record", e);
            }
        }

        function textfields(value){
            var cleanedVal = value.replace(/\t/g, ''); 
            var extraspace = cleanedVal.replace(/['"]+/g, ''); 
            log.debug("extraspace",extraspace);
            return extraspace;
        }

        //Formatting the date in MM-DD-YYYY
        function getFormattedDate(date) {
            try {
                var date_format = new Date(date);
                var month = (1 + date_format.getMonth()).toString();
                var day = date_format.getDate().toString();
                var year = date_format.getFullYear();
                return month + "/" + day + "/" + year;
            } catch (error) {
                log.error(
                    "Error encoutered while formatting the  order date",
                    error.message
                );
            }

        }

        function toBuildSOJSON(cells, salesOrderJSON) {
            try {
                const currentScript = runtime.getCurrentScript();
                //Get script parameter values.
                const tax_item = currentScript.getParameter({
                    name: "custscript_ada_tax_item",
                });
                log.debug("tax_item is", tax_item);
                /*const sales_order_form_id = currentScript.getParameter({
                    name: "custscript_ada_so_custom_form",
                });*/
                const transaction_source_id = currentScript.getParameter({
                    name: "custscript_ada_tran_src_field",
                });
                log.debug("transaction source is", transaction_source_id);
                const sales_order_currency = currentScript.getParameter({
                    name: "custscript_ada_currency",
                });
                log.debug("currency of so is", sales_order_currency);
                const customer_subsidiary = currentScript.getParameter({
                    name: "custscript_ada_subsidiary",
                });
                log.debug("subsidiary is", customer_subsidiary);
                const customer_form = currentScript.getParameter({
                    name: "custscript_ada_fonteva_customer_form"
                });
                log.debug("customerForm is ", customer_form);

                const customer_category = currentScript.getParameter({
                    name: "custscript_ada_fonteva_customer_category"
                });
                log.debug("customerCategory is", customer_category);

                const customer_status = currentScript.getParameter({
                    name: "custscript_ada_customer_status"
                });
                log.debug("customer_status", customer_status);

                var salesOrder;
                if (salesOrderJSON) {
                    salesOrder = salesOrderJSON;
                    var soItemdetailsarray = []
                    soItemdetailsarray = salesOrder.itemDetails;
                    log.debug("soItemdetailsarray", soItemdetailsarray);
                    soItemdetailsarray.push({
                        "ExternalLineID": cells[27],
                        "ItemName": cells[28],
                        "Quantity": cells[29],
                        "UnitPrice": cells[30].replace(/[^\d.]/g, ''),
                        "Rate": cells[31].replace(/[^\d.]/g, ''),
                        "Amount": cells[32].replace(/[^\d.]/g, ''),
                        "Taxamount": cells[33].replace(/[^\d.]/g, ''),
                        "IsTax": cells[34].trim()
                    });
                    salesOrder.itemDetails = soItemdetailsarray;
                }
                else {
                    var isPerson = 'T';
                    var customerExternalId;
                    var email;
                    if (cells[0] == "Account") {
                        isPerson = 'F';
                        customerExternalId = cells[1];
                        email = cells[3];

                    }
                    else {
                        email = cells[8];
                        customerExternalId = cells[5];
                    }

                    salesOrder = {
                        "tax_item": tax_item,
                        "transaction_source_id": transaction_source_id,
                        "sales_order_currency": sales_order_currency,
                        "customer_subsidiary": customer_subsidiary,
                        "subsidiary": customer_subsidiary,
                        "form": customer_form,
                        "category": customer_category,
                        'isperson': isPerson,
                        "status": customer_status,
                        "amsCustomerId": customerExternalId,
                        "AccountCompanyName":textfields(cells[2]),
                        "AccountCompanyType": cells[4],
                        "firstName": cells[6],
                        "lastName": cells[7],
                        "userEmail": email,
                        "ExternalID": cells[9],
                        "ExternalTransaction": cells[10],
                        "soCompanyId":cells[1],
                        "soCompanyName":textfields(cells[2]),
                        "Date": cells[11],
                        "Memo": cells[12],
                        "EmployeeID": cells[13],
                        "OrderSource": cells[14],
                        "BillToAttention": cells[15],
                        "BillAddress1": cells[16],
                        "BillCity": cells[17],
                        "BillState": cells[18],
                        "BillZip": cells[19],
                        "BillCountry": cells[20],
                        "ShipToAttention": cells[21],
                        "ShipAddress1": cells[22],
                        "ShipCity": cells[23],
                        "ShipvState": cells[24],
                        "ShipZip": cells[25],
                        "ShipCountry": cells[26],
                        "itemDetails": [{
                            "ExternalLineID": cells[27],
                            "ItemName": cells[28],
                            "Quantity": cells[29],
                            "UnitPrice": cells[30].replace(/[^\d.]/g, ''),
                            "Rate": cells[31].replace(/[^\d.]/g, ''),
                            "Amount": cells[32].replace(/[^\d.]/g, ''),
                            "Taxamount": cells[33].replace(/[^\d.]/g, ''),
                            "IsTax": cells[34].trim()
                        }]

                    };

                }

                //log.debug("Sales Order JSON",salesOrder);
                return salesOrder;

            }
            catch (e) {
                log.debug("error in toBuildSOJSON:", e);
                
            }
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });