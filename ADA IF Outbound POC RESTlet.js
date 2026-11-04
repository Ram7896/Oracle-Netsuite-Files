/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(["N/record","N/runtime", "N/https", "N/search","./lib/Integration Connection Library.js"], function (
  record,
  runtime,
  https,
  search,
  connect
) {
  function _post(requestBody) {
    log.debug("Post Request Received",requestBody);
    log.debug("Runtime User",runtime.getCurrentUser());
    const customerRec = record.submitFields({
      type: record.Type.CUSTOMER,
      id: requestBody.id,
      values: {
        comments: requestBody.comments,
      },
    });
    
    const response = connect.IntegrationConnection({name: "Manthan"}, 1);
    log.debug("Mule Response ", response);
    return response;
  }

  return {
    post: _post,
  };
});
