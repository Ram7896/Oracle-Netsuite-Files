/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(["N/search", "N/record", "N/runtime"],
    function (search, record, runtime) {
        function doPost(requestBody) {
            log.debug("Post Request Received", requestBody);
            try {
                const action = requestBody.messageHeader.action;
                const body = requestBody.messageContent;
                if (action == "ApprovalPermissonCreation") {
                    log.debug("Creating Contacts", requestBody);

                    return approvalPermissionList(body, requestBody);
                } else {


                    log.error("JSON Parsing Error", e.message);
                    return {
                        error: "Invalid JSON format",
                        details: e.message
                    };

                }
            } catch (e) {
                log.error("Error in doPost function:", e.message);
                return {
                    timeStamp: new Date(),
                    message: `Error encountered: ${e.message}`,
                };
            }
        }
        function approvalPermissionList(data, body) {
            try {
                log.debug("Data:", data);
                log.debug("request body:", body);
            }
            catch (e) {
                log.debug("Error in approval Permission List Function:", e.message);
            }
        }
        function programExternalId(){
            try{}catch
        }

        return {
            post: doPost
        };
    });