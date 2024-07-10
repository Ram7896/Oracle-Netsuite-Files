/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(['N/search', 'N/runtime', 'N/record'],
    function (search, runtime, record) {
        function _post(context) {
            var data = context.data;
            log.debug('Context data:', data); // Corrected log statement
            var createdCustomerIds = [];
            for (var i = 0; i < data.length; i++) { // Corrected loop condition
                var custRec = record.create({
                    type: record.Type.CUSTOMER // Use record.Type.CUSTOMER for consistency and readability
                });
                // Set required fields for customer creation
                custRec.setValue({
                    fieldId: 'companyname',
                    value: data[i].companyname // Access each object in the array using index data[i]
                });
                custRec.setValue({
                    fieldId: 'subsidiary',
                    value: data[i].subsidiary
                });
                // Save the customer record
                var cust_id = custRec.save();
                createdCustomerIds.push(cust_id);
            }
            // Return the IDs of created customer records
            return "Customer Record(s) created successfully: " + JSON.stringify(createdCustomerIds);
        }
        return {
            post: _post
        };
    });
