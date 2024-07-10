/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */
define(['N/record'], function (record) {
  function onAction(context) {
    try {
      var BankDetailId = context.newRecord.id;
      log.debug('BankDetailId:',BankDetailId);
      var BankDetailRecord = record.load({
        type: 'customrecord_2663_entity_bank_details',
        id: BankDetailId
    });
    if(BankDetailRecord == '1122'){
      BankDetailRecord.setValue({
        fieldId:'custrecordisinactive',
        value:true
      });
      BankDetailRecord.save();
    }
    log.audit({
      title:'Entity bank detail record inactivated sucessfully',
      details:'Record Id:'+BankDetailId
    });
    } catch (error) {
      log.error('Error occurred', error);
    }
  }
  return {
    onAction: onAction
  };
});