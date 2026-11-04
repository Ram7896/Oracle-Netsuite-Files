/*************************************************************************************************************************************
 * Script Name         :   Fonteva Contact creation
 * Author              :   Rama Sudhakar
 * Creation date       :   25th May 2024
 * Company             :   Capgemini India
 * Description         :   This script creates Contact in NS received from MuleSoft
 *************************************************************************************************************************************/


/**
 * RestLet to create a Sales Order Record
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define([
    "N/search",
    "N/record",
    "N/runtime",
    "./lib/Error Handling Library.js",
  ], function (search, record, runtime, errorLib) {
    function doPost(requestBody) {
      log.debug("Post Request Received", requestBody);
      try {
        const action = requestBody.messageHeader.action;
        const body = requestBody.messageContent;
  
        var inteface_error_handling_id = runtime
          .getCurrentScript()
          .getParameter("custscript_ada_so_error");
        log.debug("inteface_error_handling_id", inteface_error_handling_id);
  
        if (action == undefined) {
          return {
            PostRequestReceived: requestBody,
            NetSuiteResponse: "Post Request Received From MuleSoft",
          };
        } else if (action == "CorporateContactCreation") {
          log.debug("Creating Contacts", requestBody);
  
          return CorporateContactCreation(body, inteface_error_handling_id);
        } else {
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
  
    // This function creates Contacts in NS based on the data received
    function CorporateContactCreation(body, requestBody, inteface_error_handling_id) {
      let res = {
        timeStamp: new Date(),
      };
      try {
        const currentScript = runtime.getCurrentScript();
        // Get script parameter values
        const contact_subsidiary = currentScript.getParameter({
          name: "custscript_subsidiary",
        });
        log.debug("Subsidiary:", contact_subsidiary);
         let amsCustomerId = body.amsCustomerId;
        log.debug("amscustomerId:", amsCustomerId);
        //return "amscustomerID:"+amsCustomerId;
        //Call customer search function.
        let customerId = customerSrch(amsCustomerId);
        log.debug("customerid:", customerId);
        var createdContactIds = [];
          //log.debug("data:",data);
          var custRec = record.create({
            type: record.Type.CONTACT
          });
          // Set required fields for contact creation
          var entityid = custRec.setValue({
            fieldId: 'entityid',
            value: body.entityid
          });
          log.debug("entityid:", entityid);
          var subsidiary = custRec.setValue({
            fieldId: 'subsidiary',
            value: contact_subsidiary
          });
          log.debug("subsidiary:",subsidiary);
          var firstName = custRec.setValue({
            fieldId: 'firstname',
            value: body.firstname
          });
          log.debug("firstName:",firstName);
         var lastname = custRec.setValue({
            fieldId: 'lastname',
            value: body.lastname
          });
          log.debug("lastname:",lastname);
          var email = custRec.setValue({
            fieldId: 'email',
            value: body.email
          });
          log.debug("email:",email);
          var phone = custRec.setValue({
            fieldId: 'phone',
            value: body.phone
          });
          log.debug("phone:",phone);
         var category = custRec.setText({
            fieldId: 'custentity2',
            text: body.category
          });
          log.debug("Category:",category);
          // Save the contact record
          var contact_id = custRec.save();
          createdContactIds.push(contact_id);
          record.attach({
            record: {
                type: 'contact',
                id: contact_id
            },
            to: {
                type: 'customer',
                id: customerId
            }
        });
                // Return the IDs of created contact records
        return "Contact Record(s) created successfully: " + JSON.stringify(createdContactIds);
        
      } catch (error) {
        log.error("Error while creating Contact Records", error);
        res.message = `Error Message: ${error.message}`;
        res.contactsCreated = false;
        res.txnStatus = `FAILED`;
        errorLib.Search_ErrorHandlingInterface({
          id: inteface_error_handling_id,
          type: "error",
          body: `Error Message: ${error.message} \n\n Received JSON:` + JSON.stringify(requestBody),
        });
  
        return res;
      }
    }
    //function to create Customer Search.
        function customerSrch(amsCustomerId) {
          try {
            var customerSearchObj = search.create({
              type: "customer",
              filters: [
                ["custentity1", "is", amsCustomerId],
                "AND",
                ["isinactive", "is", "F"],
              ],
              columns: [
                search.createColumn({
                  name: "internalid",
                  label: "ID",
                }),
              ],
            });
            let count = customerSearchObj.runPaged().count;
            if (count === 0) {
              return undefined;
            }
            var result = customerSearchObj.run().getRange(0, 2);
            log.debug("SearchResults:", result);
            var customer_internalId = result[0].getValue({
              name: "internalid",
            });
            log.debug("customer_internalId", customer_internalId);
  
            return customer_internalId;
          } catch (error) {
            log.error("Error Message", error);
          }
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
    return {
      post: doPost
    };
  });
  