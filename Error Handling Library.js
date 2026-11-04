/**
 * @NApiVersion 2.1
 * @NModuleScope public
 */
define([`N/email`, `N/record`], function (email, record) {
  function Search_ErrorHandlingInterface(dataObj) {
    try {
      const interfaceId = dataObj.id;
      const type = dataObj.type.toLowerCase()
      if (interfaceId) {
        const intRecord = record.load({
          type: `customrecord_ada_interface_errorhandling`,
          id: interfaceId,
        });
        
        email.send({
          author: 163838,
          recipients: intRecord.getText(`custrecord_ada_to_email`),
          cc: [intRecord.getText("custrecord_ada_cc")],
          subject: intRecord.getText(`custrecord_ada_${type}_subject`),
          body: `Hello \n\n${dataObj.body}\n\nRegards,\nOracle NetSuite`,
        });
        log.debug("Error email sent")
      }
    } catch (error) {
      log.debug("Error in email alert",error)
    }
  }
  return {
    Search_ErrorHandlingInterface: Search_ErrorHandlingInterface,
  };
});
