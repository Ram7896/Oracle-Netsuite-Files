/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */
define(['N/record'], function (record) {
  function onAction(scriptcontext) {
    try {
      log.debug('Script started');
      var itemRecord = scriptcontext.newRecord; 
      // Get the selected unit type on the item
      var unitType = itemRecord.getValue({
        fieldId: 'purchaseconversionrate'
      });
      log.debug(unitType);
        /*switch(unitType){
          case '12':
            var items=itemRecord.setValue({
              fieldId:'custitem_rate_unit',
              value:'2',
              ignoreFieldChange:true
            });
            default:
              log.debug('Error in unittype');
            break;
        }
        log.debug(items);*/

        itemRecord.setValue({
          fieldId:'custitem_rate_unit',
          value:unitType
        });
    } catch (error) {
      log.error('Error occurred', error);
    }
  }
  return {
    onAction: onAction
  };
});