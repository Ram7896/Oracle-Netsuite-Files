/** 
 * @NApiVersion 2.x
 * @NScriptType Restlet
*/
define(['N/search', 'N/runtime', 'N/record'],
    function (search, runtime, record) {
        function _post(context) {
            var custRec = record.create({
                type: "customer"
            });
            custRec.setValue({
                fieldId: 'companyname',
                value: context.companyname
            });
            custRec.setValue({
                fieldId: 'subsidiary',
                value: context.subsidiary
            });
          custRec.setValue({
                fieldId: 'phone',
                value: context.phone
            });
            var cust_id = custRec.save();
            //return String(cust_id);
            return "Post Customer Created(Id:" + cust_id + ")";
        }
        function _get(context) {
            // Load existing customer record
            var customerRecord = record.load({
                type: 'customer',
                id: context.internalid,
                isDynamic: true,
            });

            // Retrieve and return customer field values
            var companyName = customerRecord.getValue({
                fieldId: 'companyname'
            });
            var subsidiary = customerRecord.getValue({
                fieldId: 'subsidiary'
            });
            var phone = customerRecord.getValue({
                fieldId: 'phone'
            });
            return 'Company Name: ' + companyName + 'subsidiary:' + subsidiary + 'Phone:'+ phone;
        }
        function _put(context) {
            var UpdateRecord = record.load({
                type: 'customer',
                id: context.internalid,
                isDynamic: true,
            });
    
            // Update customer field values
            UpdateRecord.setValue({
                fieldId: 'phone',
                value: context.phone
            });
    
            // Save the updated customer record
            var update_record=UpdateRecord.save();
    
            return 'Customer updated successfully:',update_record;
        }
        function _delete(context) {
            record.delete({
                type: 'customer',
                id: context.internalid,
            });
    
            return 'Customer deleted successfully';
        }
        return {
            post: _post,
            get:_get,
            put:_put,
            delete:_delete
        };
    });
