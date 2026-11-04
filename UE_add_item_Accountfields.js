/*************************************************************************************************************************************
 * Script Name			:	ADA Add Item Account fields to Items UE
 * Author   		    :   Karamjeet Kaur
 * Creation date		:	19th July 2023
 * Company	  			:	Capgemini India
 * Description			:	This script adds accoutns fields on the creation of item, depending on the item type and ada item type, by referring the ADA Item
                             Accounting  Custom Record.
 * Change Log	  		:	||    Changed By    ||    Date    ||            Description           ||
                      ||                  ||            ||                                  ||
 *************************************************************************************************************************************/

/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/currentRecord", "N/record", "N/runtime", "N/search"], function (
  currentRecord,
  record,
  runtime,
  search
) {
  function beforeSubmit(context) {
    try {
          if (context.type !== context.UserEventType.CREATE) {
             return; // only execute on create events
        }
      var currentScript = runtime.getCurrentScript();
       var item_type = currentScript.getParameter({
                       name: "custscript_item_type_value"
                  });
      log.audit("ItemType",item_type);

      var newRecord = context.newRecord;
      var recType = newRecord.type;

      //Get all the field values from item record
      var ada_item_type = newRecord.getValue({
        fieldId: "custitem_ada_item_type_field",
      });

      var item_typename = newRecord.getValue({
        fieldId: "itemtypename",
      });

      ////Create Saved Search on ADA item Accounting custom record.
      var searchObj = search.create({
        type: "customrecord_ada_item_accounting",
        filters: [
          ["isinactive", "is", "F"],
          "AND",
          ["custrecord_ada_item_type", "anyof", ada_item_type],
          "AND",
        ["custrecord_ada_item_type_", "anyof", item_type],
        ],
        columns: [
          { name: "custrecord_ada_account" },
          { name: "custrecord_ada_cus_return_var_acc" },
          { name: "custrecord_ada_def_exp_acc" },
          { name: "custrecord_ada_exchange_rate_var_acc" },
          { name: "custrecord_ada_exp_acc" },
          { name: "custrecord_ada_gain_loss_acc" },
          { name: "custrecord_ada_income_account" },
          { name: "custrecord_ada_intercompany_income_acc" },
          { name: "custrecord_ada_intercompany_exp_acc" },
          { name: "custrecord_ada_intercompany_cogs" },
          { name: "custrecord_ada_price_variance_acc" },
          { name: "custrecord_ada_qty_variance_acc" },
          { name: "custrecord_ada_ven_return_var_acc" },
          { name: "custrecord_ada_item_type_" },
        ],
      });
  
      var searchResult = searchObj.run();

    if(searchResult && searchResult > 0){
      var startIndex = 0;
      var resultSet = searchResult.getRange(startIndex, startIndex + 1000);
        for (var i = 0; i < resultSet.length; i++) {
          // create an object containing the details of the search result
          var ada_type_value = resultSet[i].getText({
            name: "custrecord_ada_item_type_",
          });
          var account = resultSet[i].getValue({
            name: "custrecord_ada_account",
          });
          var cus_return_varaiance_acc = resultSet[i].getValue({
            name: "custrecord_ada_cus_return_var_acc",
          });
          var deferred_exp_acc = resultSet[i].getValue({
            name: "custrecord_ada_def_exp_acc",
          });
          var exchange_rate_var_acc = resultSet[i].getValue({
            name: "custrecord_ada_exchange_rate_var_acc",
          });
          var expense_acc = resultSet[i].getValue({
            name: "custrecord_ada_exp_acc",
          });
          var gain_loss_acc = resultSet[i].getValue({
            name: "custrecord_ada_gain_loss_acc",
          });
          var income_account = resultSet[i].getValue({
            name: "custrecord_ada_income_account",
          });
          var intercompany_income_acc = resultSet[i].getValue({
            name: "custrecord_ada_intercompany_income_acc",
          });
          var intercompany_exp_acc = resultSet[i].getValue({
            name: "custrecord_ada_intercompany_exp_acc",
          });
          var intercompany_cogs_acc = resultSet[i].getValue({
            name: "custrecord_ada_intercompany_cogs",
          });
          var price_variance_acc = resultSet[i].getValue({
            name: "custrecord_ada_price_variance_acc",
          });          
          var quantity_var_acc = resultSet[i].getValue({
            name: "custrecord_ada_qty_variance_acc",
          });
          var vendor_return_var_acc = resultSet[i].getValue({
            name: "custrecord_ada_ven_return_var_acc",
          });
        }
      }

      //Set Field Values on Item Record
      if (recType == "inventoryitem") {
        newRecord.setValue({
          fieldId: "billpricevarianceacct",
          value: price_variance_acc,
        });
        newRecord.setValue({
          fieldId: "intercocogsaccount",
          value: intercompany_cogs_acc,
        });
        newRecord.setValue({ fieldId: "incomeaccount", value: income_account });
        newRecord.setValue({
          fieldId: "intercoincomeaccount",
          value: intercompany_income_acc,
        });
        newRecord.setValue({
          fieldId: "gainlossaccount",
          value: gain_loss_acc,
        });
        newRecord.setValue({
          fieldId: "billqtyvarianceacct",
          value: quantity_var_acc,
        });
        newRecord.setValue({
          fieldId: "vendreturnvarianceaccount",
          value: vendor_return_var_acc,
        });
        newRecord.setValue({
          fieldId: "custreturnvarianceaccount",
          value: cus_return_varaiance_acc,
        });
        newRecord.setValue({
          fieldId: "billexchratevarianceacct",
          value: exchange_rate_var_acc,
        });
      } else if (recType == "kititem") {
        newRecord.setValue({
          fieldId: "incomeaccount",
          value: income_account,
        });
      } else if (recType == "otherchargeitem") {
        newRecord.setValue({
          fieldId: "billpricevarianceacct",
          value: price_variance_acc,
        });
        newRecord.setValue({
          fieldId: "billqtyvarianceacct",
          value: quantity_var_acc,
        });
        newRecord.setValue({
          fieldId: "billexchratevarianceacct",
          value: exchange_rate_var_acc,
        });
        newRecord.setValue({
          fieldId: "deferralaccount",
          value: deferred_exp_acc,
        });
        newRecord.setValue({
          fieldId: "expenseaccount",
          value: expense_acc,
        });
        newRecord.setValue({
          fieldId: "incomeaccount",
          value: income_account,
        });
        newRecord.setValue({
          fieldId: "intercoincomeaccount",
          value: intercompany_income_acc,
        });
        newRecord.setValue({
          fieldId: "intercoexpenseaccount",
          value: intercompany_exp_acc,
        });
      } else if (recType == "serviceitem") {
        newRecord.setValue({
          fieldId: "billpricevarianceacct",
          value: price_variance_acc,
        });
        newRecord.setValue({
          fieldId: "billqtyvarianceacct",
          value: quantity_var_acc,
        });
        newRecord.setValue({
          fieldId: "billexchratevarianceacct",
          value: exchange_rate_var_acc,
        });
        newRecord.setValue({
          fieldId: "deferralaccount",
          value: deferred_exp_acc,
        });
        newRecord.setValue({
          fieldId: "expenseaccount",
          value: expense_acc,
        });
        newRecord.setValue({
          fieldId: "incomeaccount",
          value: income_account,
        });
        newRecord.setValue({
          fieldId: "intercoincomeaccount",
          value: intercompany_income_acc,
        });
        newRecord.setValue({
          fieldId: "intercoexpenseaccount",
          value: intercompany_exp_acc,
        });
      } else if (recType == "noninventoryitem") {
        
        newRecord.setValue({
          fieldId: "billpricevarianceacct",
          value: price_variance_acc,
        });
        newRecord.setValue({
          fieldId: "billqtyvarianceacct",
          value: quantity_var_acc,
        });
        newRecord.setValue({
          fieldId: "billexchratevarianceacct",
          value: exchange_rate_var_acc,
        });
        newRecord.setValue({
          fieldId: "deferralaccount",
          value: deferred_exp_acc,
        });
        newRecord.setValue({
          fieldId: "expenseaccount",
          value: expense_acc,
        });
        newRecord.setValue({
          fieldId: "incomeaccount",
          value: income_account,
        });
        newRecord.setValue({
          fieldId: "intercoincomeaccount",
          value: intercompany_income_acc,
        });
        newRecord.setValue({
          fieldId: "intercoexpenseaccount",
          value: intercompany_exp_acc,
        });
      }
    } catch (e) {
      log.error("Error in code", e.message);
    }
  }

  return {
    beforeSubmit: beforeSubmit,
  };
});
