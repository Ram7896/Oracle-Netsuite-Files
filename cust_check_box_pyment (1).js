/**
* @NApiVersion 2.x
* @NScriptType ClientScript
*/

define(['N/currentRecord', 'N/ui/message'], function (currentRecord, message) {
    function validateCustomerPayment() {
        var currentRecordObj = currentRecord.get();
        var paymentMethod = currentRecordObj.getValue({
            fieldId: 'custbodycustbody_payment_method1'
        });
        log.debug('cursor entered into the form');
        var toBePrinted = currentRecordObj.getValue({
            fieldId: 'custbody_printed1'
        });
        log.debug('to be printed is triggered');
         /*
        if (paymentMethod == 1 && !toBePrinted) {
            var errorMessage = 'Please check the box "to be printed" to proceed.';
            showMessage(errorMessage);
            return false,
        
        
        log.debug('paymentmethod1 is triggered');
        }
       else if (paymentMethod != 1 && toBePrinted) {
            var errorMessage = 'Customer\'s Payment Method is not cheque.';
            showMessage(errorMessage);
            return false,
        
        log.debug('paymentmethod2 is triggered');
        }
        return true;
    } */
    if (paymentMethod === '1' && toBePrinted !== 'T') {
        alert("Customer's Payment Method is not cheque.");
        return false;
        }
        else if(paymentMethod === '2' || toBePrinted !== 'F') {
        alert('This customer has payment method as "cheque", Please check the box "to be printed" to proceed.');
       return false;
        }
        return true;
        }
    function showMessage(errorMessage) {
        var messageObj = message.create({
            title: 'Error',
            message: errorMessage,
            type: message.Type.ERROR,
            duration: 20000
        });
        messageObj.show();
    }
    return {
        /*validateField: function (context) {
            if (context.fieldId == 'custbody_printed1') {
                return validateCustomerPayment();
            }
            //return true;
        }*/
        validateField:validateCustomerPayment
    };

}); 
/*
define([], function () {
    function validatePayment() {
    var paymentMethod = nlapiGetFieldValue('custentity_payment_method');
    var toBePrinted = nlapiGetFieldValue('custbody_to_be_printed');
    if (paymentMethod === '1' && toBePrinted !== 'T') {
    alert("Customer's Payment Method is not cheque.");
    return false;
    }
    if (paymentMethod === '2' && toBePrinted === 'T') {
    alert('This customer has payment method as "cheque", Please check the box "to be printed" to proceed.');
    return false;
    }
    return true;
    }
    
    return {
    validateField: validatePayment,
    };
    }); */