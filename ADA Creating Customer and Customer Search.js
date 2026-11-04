/**
 * @NApiVersion 2.1
 * @NModuleScope public
 */
define(["N/search", "N/record"], function (search, record) {
  function createCustomer(data, configs) {
    try {
        const customerRec = record.create({
            type: record.Type.CUSTOMER,
        });
        customerRec.setValue({
            fieldId: "subsidiary",
            value: "2",
        });
        customerRec.setValue({
            fieldId: "isperson",
            value: "T",
        });
        customerRec.setValue({
            fieldId: "firstname",
            value: data.firstName,
        });
        customerRec.setValue({
            fieldId: "lastname",
            value: data.lastName,
        });
        customerRec.setValue({
            fieldId: "email",
            value: data.userEmail,
        });
        customerRec.setValue({
            fieldId: "custentity_ada_ams_customer_id",
            value: data.amsCustomerId,
        });

        let customerId = customerRec.save();
        log.debug(`Customer created: ${customerId}`);
        configs.res.customerId = customerId;
        configs.res.createdCustomer = true;
       return customerId;
       // return createStandAloneCashRefund(data, configs, customerId);

    } catch (error) {
        log.error("Error creating customer:", error);
        configs.res.message = `Error creating customer: ${error.message}`;
        return null;
    }
  }
    function customerSrch(amsCustomerId, data, configs) {
      try {
          var customerSearchObj = search.create({
              type: "customer",
              filters: [
                  ["custentity_ada_ams_customer_id", "is", amsCustomerId],
                  "AND",
                  ["isinactive", "is", "F"],
              ],
              columns: [
                  search.createColumn({ name: "internalid", label: "ID" }),
              ],
          });

          let count = customerSearchObj.runPaged().count;
          if (count === 0) {
              // Create customer if not found
              return createCustomer(data, configs);
          } else {
              var result = customerSearchObj.run().getRange(0, 1);
              var customer_internalId = result[0].getValue({ name: "internalid" });
              log.debug("Customer found. Internal ID:", customer_internalId);

              return customer_internalId;
          }
      } catch (error) {
          log.error("Error searching for customer:", error);
          configs.res.message = `Error searching for customer: ${error.message}`;
          return null;
      }
  }
  return {
    createCustomer:createCustomer,
    customerSrch:customerSrch
  };
});