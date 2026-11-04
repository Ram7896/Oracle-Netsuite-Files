/*************************************************************************************************************************************
 * Script Name         :   Fonteva Corporate Contact creation
 * Author              :   Rama Sudhakar
 * Creation date       :   29th May 2024
 * Company             :   Capgemini India
 * Description         :   This script creates Contact in NS received from Fonteva
  * Change Log	  		:	||    Changed By    ||    Date          ||            Description                    ||
 *************************************************************************************************************************************/
/**
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
        .getParameter("custscript_ada_contact_error_handling");
      log.debug("inteface_error_handling_id", inteface_error_handling_id);

      if (action == "CorporateContactCreation") {
        log.debug("Creating Contacts", requestBody);

        return CorporateContactCreation(body, requestBody, inteface_error_handling_id);
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

  // This function creates Contact in NS based on the data received
  function CorporateContactCreation(body, requestBody, inteface_error_handling_id) {
    let res = {
      timeStamp: new Date(),
    };
    try {
      const currentScript = runtime.getCurrentScript();
      // Get script parameter values
      const contact_subsidiary = currentScript.getParameter({
        name: "custscript_ada_contact_subsidiary",
      });
      log.debug("Subsidiary:", contact_subsidiary);
      var createdContactIds = [];
      var custRec = record.create({
        type: record.Type.CONTACT
      });
      // Set required fields for contact creation
      custRec.setValue({
        fieldId: 'entityid',
        value: body.entityid
      });
      custRec.setValue({
        fieldId: 'externalid',
        value: body.externalId
      });
      custRec.setValue({
        fieldId: 'subsidiary',
        value: contact_subsidiary
      });
      custRec.setValue({
        fieldId: 'firstname',
        value: body.firstname
      });
      custRec.setValue({
        fieldId: 'lastname',
        value: body.lastname
      });
      custRec.setValue({
        fieldId: 'email',
        value: body.email
      });
      custRec.setValue({
        fieldId: 'phone',
        value: body.phone
      });
      // let categorylist = [];
      /* body.category.forEach((list) => {
         log.debug('category list:', list);
         categorylist.push(list);
         log.debug('Category List:', categorylist);
       });*/
      custRec.setText({
        fieldId: 'category',
        text: body.category
      });
      // Save the contact record
      var contact_id = custRec.save();
      createdContactIds.push(contact_id);
      // Iterate over each amsCustomerId
      const CustomerNameFilter = [];
      let CustomerCount = body.customers.length;
      log.debug('Customer count:', CustomerCount);
      if (CustomerCount > 0) {
        body.customers.forEach((element, i) => {
          if (i === CustomerCount - 1) {
            CustomerNameFilter.push(["custentity_ada_ams_customer_id", "is", element]);
          } else {
            CustomerNameFilter.push(["custentity_ada_ams_customer_id", "is", element]);
            CustomerNameFilter.push("OR");
          }
        });
        log.debug("Customer Filter Array", CustomerNameFilter);
        // Call customer search function.
        let customerIds = customerSrch(CustomerNameFilter);
        log.debug("customerIds:", customerIds);
        if (customerIds) {
          customerIds.forEach(customerId => {
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
          });
        } else {
          //Customers Not attaching
        }
        res.ContactCreated = true;
        res.txnStatus = "SUCCESS";
        res.contactId = contact_id;
        res.message = "Contact Successfully Created in NS";
        return res;
        // Return the IDs of created contact records
       // return "Contact Record created successfully: " + JSON.stringify(createdContactIds);
      }
      else {
        throw new Error("Customer not found in NetSuite.");
      }
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
  function customerSrch(CustomerNameFilter) {
    try {
      const CustomerSearchObj = search.create({
        type: "customer",
        filters: CustomerNameFilter,
        columns: [
          { name: "internalid" },
        ],
      });

      const CustomerSearchCount = CustomerSearchObj.runPaged().count;
      log.audit(`Search Result count`, CustomerSearchCount);
      if (CustomerSearchCount === 0) {
        //throw new Error("Customer not found in NetSuite.");
      }

      const customerIds = [];
      CustomerSearchObj.run().each(function (result) {
        const customerId = result.getValue("internalid");
        log.debug('CustomerId:', customerId);
        customerIds.push(customerId);
        return true;
      });

      return customerIds;
    } catch (error) {
      log.error("Error Message", error);
      return null;
    }
  }

  return {
    post: doPost
  };
});