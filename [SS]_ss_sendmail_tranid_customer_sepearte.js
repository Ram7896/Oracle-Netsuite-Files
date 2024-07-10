/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(['N/search', 'N/email', 'N/runtime', 'N/log'], function(search, email, runtime, log) {
function execute(context) {
    try {
        // Define your saved search ID here
        var savedSearchId = 'customsearch1768';

        // Load saved search
        var mySearch = search.load({
            id: savedSearchId
        });

        // Run saved search
        var searchResults = mySearch.run().getRange({
            start: 0,
            end: 1000 // Adjust based on your expected maximum results
        });

        // Process search results
        var emailDataMap = {};

        searchResults.forEach(function(result) {
            var emailAddr = result.getValue({
                name: 'email'
            });

            if (isValidEmail(emailAddr) && isEmployee(emailAddr)) {
                var transactionId = result.id; // Assuming the transaction ID is stored in the "id" property

                if (!emailDataMap[emailAddr]) {
                    emailDataMap[emailAddr] = []; // Initialize array for new email address
                }

                if (emailDataMap[emailAddr].indexOf(transactionId) === -1) { // Check if transaction ID already exists
                    emailDataMap[emailAddr].push(transactionId);
                }
            }
        });

        // Send emails
        for (var emailAddr in emailDataMap) {
            if (emailDataMap.hasOwnProperty(emailAddr)) {
                var transactionIds = emailDataMap[emailAddr].join(', ');
                sendEmailWithTransactionIds(emailAddr, transactionIds);
            }
        }
    } catch (e) {
        log.error('Error', e);
    }
  
    function isValidEmail(email) {
        // Basic email validation
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isEmployee(emailAddr) {
        // Check if the email address corresponds to an employee
        // Implement your logic to validate if email belongs to an employee
        return true; // Dummy logic, replace with your actual logic
    }
   
    function sendEmailWithTransactionIds(emailAddr, transactionIds) {
    try {
        var emailBody = 'The following transaction IDs have been repeated:\n\n' + transactionIds;
        email.send({
            author:'859',
            recipients: '809',
            subject: 'Repeated Transaction IDs',
            body: emailBody
        });
        log.debug('Email sent successfully to: ' + emailAddr);
    } catch (ex) {
        log.error('Error sending email to ' + emailAddr + ': ' + ex.name + ' - ' + ex.message);
    }
}
}   return {
        execute: execute
    };

});
