/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define([], function() {

    function saveRecord(context) {
      // Get the current record
      var currentRecord = context.currentRecord;
  
      // Get the sublist count
      var sublistCount = currentRecord.getLineCount({
        sublistId: 'item' // Replace 'sublist_id' with the actual sublist ID
      });
  
      // Initialize variables to store total amount and total price
      var totalAmount = 0;
      var totalPrice = 0;
  
      // Calculate total amount and total price from sublist
      for (var i = 0; i < sublistCount; i++) {
        totalAmount += currentRecord.getSublistValue({
          sublistId: 'item', // Replace 'sublist_id' with the actual sublist ID
          fieldId: 'amount',
          line: i
        });
        log.debug('totalamount:',totalAmount);
        totalPrice += currentRecord.getSublistValue({
          sublistId: 'item', // Replace 'sublist_id' with the actual sublist ID
          fieldId: 'rate',
          line: i
        });
        log.debug('totalprice:',totalPrice);
      }
  
      // Calculate the difference
      var difference = totalAmount - totalPrice;
      log.debug('difference:',difference);
      // Check if there's a difference
      if (difference !== 0) {
        // Display a confirmation dialog
        var isConfirmed = confirm("There is a difference between the total amount and total price in the sublist. Are you sure you want to save this record?");
  
        // If user confirms the dialog
        if (isConfirmed) {
          // Return true to proceed with saving the record
          return true;
        } else {
          // Return false to prevent saving the record
          return false;
        }
      } else {
        // If there's no difference, return true to proceed with saving the record
        return true;
      }
    }
  
    return {
      saveRecord: saveRecord
    };
  
  });
  