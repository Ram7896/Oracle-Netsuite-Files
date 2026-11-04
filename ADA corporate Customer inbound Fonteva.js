/*************************************************************************************************************************************
* Script fieldId			:	ADA Corporate Customer Inbound RL
* Author   			        :	Vaibhavi Manchala
* Creation date		        :	02nd May 2024
* Company	  			    :	Capgemini India
* Description			    :	This script is used to Create Corporate Customers.
* Change Log	  		    :	||    Changed By         ||    Date        ||            Description                                ||
                                                               
*************************************************************************************************************************************/

/**
 * RestLet to create a Customer Record
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */

define(["N/record", "N/runtime", "./lib/Error Handling Library.js"], function (record, runtime, errorLib) {
    function doPost(requestBody) {
        log.debug("Post Request Received", requestBody);
        try {
            const action = requestBody.messageHeader.action;
            log.debug("action", action);
            const body = requestBody.messageContent;
            log.debug("body", body);

            var inteface_error_handling_id = runtime.getCurrentScript().getParameter("custscript_ada_corp_cust_error_handling");
            log.debug("inteface_error_handling_id", inteface_error_handling_id);
            if (action == "corporateCustomer") {
                log.debug("Creating corporate Customer", requestBody);
                return CreateCorpCustomer(body, inteface_error_handling_id);
            }
            else {
                errorLib.Search_ErrorHandlingInterface({
                    id: inteface_error_handling_id,
                    type: "error",
                    body:
                        "Invalid action on received JSON:  \n\n" +
                        JSON.stringify(requestBody),
                });
                log.debug("Invalid Action: ", action);
            }
        } catch (e) {
            errorLib.Search_ErrorHandlingInterface({
                id: inteface_error_handling_id,
                type: "error",
                body:
                    "Invalid action on received JSON:  \n\n" +
                    JSON.stringify(requestBody),
            });
            log.error("Error message", e);

            return {
                timeStamp: new Date(),
                message: `Error encountered: ${e.message}`,
            };
        }
    }

    function CreateCorpCustomer(body, inteface_error_handling_id) {
        let res = {
            timeStamp: new Date(),
        };
        try {
            const currentScript = runtime.getCurrentScript();
            const subsidiaryId = currentScript.getParameter({ name: 'custscript_subsidiary' });
            log.debug("subsidiaryId", subsidiaryId);

            // Create Corporate Customers
            const customerRec = record.create({
                type: record.Type.CUSTOMER,
            });

            // Set customer field values
            customerRec.setValue({
                fieldId: "subsidiary",
                value: subsidiaryId
            });
            //externalid
            customerRec.setValue({
                fieldId: "externalid",
                value: body.externalId
            });

            //mandatory field
            customerRec.setValue({
                fieldId: "companyname",
                value: body.companyName
            });
            customerRec.setValue({
                fieldId: "custentity_ada_ams_customer_id",
                value: body.amsCustomerId
            });
            customerRec.setValue({
                fieldId: "email",
                value: body.email
            });
            customerRec.setText({
                fieldId: "category",
                text: body.category
            });

            customerRec.setText({
                fieldId: "custentity_ada_corporate_type",
                text: body.corporateType
            });
            customerRec.setText({
                fieldId: "terms",
                text: body.terms
            });
            customerRec.setValue({
                fieldId: "creditlimit",
                value: body.creditLimit
            });
            customerRec.setText({
                fieldId: "parent",
                text: body.parentCompany
            });

            customerRec.setSublistValue({
                sublistId: "addressbook",
                fieldId: "defaultbilling",
                line: 0,
                value: true
            });
            customerRec.setSublistValue({
                sublistId: "addressbook",
                fieldId: "defaultshipping",
                line: 0,
                value: true
            });
            var sublistSubrecord = customerRec.getSublistSubrecord({
                sublistId: "addressbook",
                fieldId: "addressbookaddress",
                line: 0
            });
            log.debug('sublist subrecord', sublistSubrecord);

            var defbill = customerRec.getSublistValue({
                sublistId: "addressbook",
                fieldId: "defaultbilling",
                line: 0
            });
            log.debug("default Billing checkbox is", defbill);

            var defship = customerRec.getSublistValue({
                sublistId: "addressbook",
                fieldId: "defaultshipping",
                line: 0
            });
            log.debug("default Billing checkbox is", defship);

            if (defship === true && defbill === true) {

                sublistSubrecord.setValue({
                    fieldId: 'addr1',
                    value: body.billToAddressLine1
                });
                sublistSubrecord.setValue({
                    fieldId: "addr2",
                    value: body.billToAddressLine2
                });
                sublistSubrecord.setValue({
                    fieldId: "city",
                    value: body.billToCity
                });
                sublistSubrecord.setValue({
                    fieldId: "dropdownstate",
                    value: body.billToState
                });
                sublistSubrecord.setValue({
                    fieldId: "zip",
                    value: body.billToZipCode
                });
                sublistSubrecord.setValue({
                    fieldId: "country",
                    text: body.billToCountry
                });
                sublistSubrecord.setValue({
                    fieldId: "addr1",
                    value: body.shipToAddressLine1
                });
                sublistSubrecord.setValue({
                    fieldId: "addr2",
                    value: body.shipToAddressLine2
                });
                sublistSubrecord.setValue({
                    fieldId: "city",
                    value: body.shipToCity
                });
                sublistSubrecord.setValue({
                    fieldId: "dropdownstate",
                    value: body.shipToState
                });
                sublistSubrecord.setValue({
                    fieldId: "zip",
                    value: body.shipToZipCode
                });
                sublistSubrecord.setValue({
                    fieldId: "country",
                    value: body.shipToCountry
                });

                var customerId = customerRec.save();
                log.debug('corporate customer record is created', customerId);
                res.timeStamp = new Date(),
                    res.success = true,
                    res.txnStatus = "SUCCESS",
                    res.customerId = customerId,
                    res.message = "Corporate customer created successfully."
                return res;
            }
        } catch (e) {
            log.error("Error while creating Corporate Customer", e);
            res.message = `Error Message: ${e.message}`;
            res.ccCreated = false;
            res.txnStatus = `FAILED`;
            errorLib.Search_ErrorHandlingInterface({
                id: inteface_error_handling_id,
                type: "error",
                body:
                    `Error Message: ${e.message} \n\n Received JSON:` +
                    JSON.stringify(body),
            });
            return res;
        }
    }
    return {
        post: doPost
    };
});