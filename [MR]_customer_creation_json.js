/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */

define(['N/file', 'N/record', 'N/log'], 

function(file, record, log) {

    function getInputData(context) {
        // Retrieve the JSON file from the file cabinet
        var fileId = '706695';
        var fileObj = file.load({ id: fileId });
        var fileContent = fileObj.getContents();

        // Parse JSON data
        var jsonData = JSON.parse(fileContent);

        // Return the JSON data
        return jsonData.customer; // Assuming customer is the array containing customer data
    }

    function map(context) {
        try {
            // Map JSON data to customer record fields
            var mapValue = JSON.parse(context.value);
            log.debug('Map Value:', mapValue);
           var name = mapValue.companyname;
           log.debug("name:",name);
           var Subsidiary = mapValue.subsidiary;
           log.debug("subsidiary:",Subsidiary);
           var email = mapValue.email;
           log.debug("email:",email);
          var entityStatus = mapValue.entitystatus;
          log.debug("entityStatus:",entityStatus);
            // Create customer record
            var customer = record.create({ 
                type: record.Type.CUSTOMER
             });
            if (mapValue.companyname) {
                customer.setValue({ fieldId: 'companyname', value: name });
            } else {
                throw 'Required field "companyname" is missing or empty.';
            }

            if (mapValue.subsidiary) {
                customer.setValue({ fieldId: 'subsidiary', value: Subsidiary });
            } else {
                throw 'Required field "subsidiary" is missing or empty.';
            }

            if (mapValue.email) {
                customer.setValue({ fieldId: 'email', value: email });
            } else {
                throw 'Required field "email" is missing or empty.';
            }
             if (mapValue.entitystatus) {
                customer.setValue({ fieldId: 'entitystatus', value: mapValue.entitystatus });
            } else {
                throw 'Required field "entitystatus" is missing or empty.';
            }
            mapValue.entitystatus
            // Save customer record
            var customerId = customer.save();
            log.debug({ title: 'Customer Created', details: customerId });
        } catch (e) {
            log.error({ title: 'Error Creating Customer', details: e });
        }
    }

    function summarize(summary) {
        log.audit({ title: 'Script Complete', details: summary });
    }
    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});
