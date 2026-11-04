/*************************************************************************************************************************************
 * Script Name			:	ADA Auto Fulfillment Creation from SO MR
 * Author   		    :   Karamjeet Kaur
 * Creation date		:	27th July 2023
 * Company	  			:	Capgemini India
 * Description			:	This script is used to create an auto-fulfillment record from sales orders based on saved search criteria.
 * Change Log	  		:	||    Changed By    ||    Date    ||            Description           ||
                      ||                  ||            ||                                  ||
 *************************************************************************************************************************************/

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope public
 */
define(['N/record', 'N/search', 'N/runtime'],
	function(record, search, runtime ) {

		function GetInputData() {
	
				log.audit('Map / Reduce START', new Date());
				var currentScript = runtime.getCurrentScript();

				//Get script parameter values.
				var savedSeachId = currentScript.getParameter({
					name: "custscript_so_saved_srch_id"
				});
				log.debug('savedSeachId', savedSeachId)

				if (savedSeachId) {
					var load_saved_search = search.load({
						id: savedSeachId,
					});
					log.debug("load_saved_search", load_saved_search);

					return load_saved_search;
				} else {
					log.error("Saved search Id not provided in script parameter");
				}
		}

		function Reduce(context) {
         
			//log.debug({	title: 'Reduce',details: 'context: ' + JSON.stringify(context)});

			//Get the sales order id.
			    var soRecordId = context.key;
				var contextValues = context.values;
				var arrSoItemId = [];

				for (var i = 0; i < contextValues.length; i++) {
					var soItemId = JSON.parse(contextValues[i]).values.item.value;
					arrSoItemId.push(soItemId);
				}
				log.debug(soRecordId + " # Start", "Auto item fulfillment creation process started ...");

				// Create fulfillment record from Sales Order	
				CreateItemfulfilmentFromSO(soRecordId, arrSoItemId);

		}

		function CreateItemfulfilmentFromSO(soRecordId, arrSoItemId) {
			try {
				// Create Item fulfillment record from Sales Order
				var item_fulfillmentRecord = record.transform({
					fromType: record.Type.SALES_ORDER,
					fromId: soRecordId,
					toType: record.Type.ITEM_FULFILLMENT,
					isDynamic: true
				});

				item_fulfillmentRecord.setValue({
					fieldId: "shipstatus",
					value: "C"
				});
				var ItemLineCount = item_fulfillmentRecord.getLineCount({
					sublistId: "item",
				});
				log.debug("itemlinecount", ItemLineCount);

				for (var j = 0; j < ItemLineCount; j++) {
					var ItemId = item_fulfillmentRecord.getSublistValue({
						sublistId: "item",
						fieldId: "item",
						line: j,
					});

					// fulfill those sales order lines that meet saved search criteria; otherwise, remove item lines on record.
					if (arrSoItemId.indexOf(ItemId) !== -1) {
						//   log.debug('Items to be added', "i " + i + '| ' + "ItemId " + ItemId );
						continue;
					} else {
						//    log.debug('Items to be removed', "i " + i + '| ' + "ItemId " + ItemId);

						item_fulfillmentRecord.selectLine({
							sublistId: "item",
							line: j,
						});
						item_fulfillmentRecord.setCurrentSublistValue({
							sublistId: "item",
							fieldId: "itemreceive",
							value: false,
						});
						item_fulfillmentRecord.commitLine({
							sublistId: "item"
						});
					}
				}
				var fulfillmentRecordId = item_fulfillmentRecord.save({
                  enableSourcing: true
                });

				log.debug("Item Fulfillment Record Created Successfully", "item fulfillment ID : " + fulfillmentRecordId);

			} catch (err) {
				log.error("CreateItemfulfilmentFromSO", err);
			}
		}
      
		function Summarize(summary) {
			try {
			var currentScript = runtime.getCurrentScript();
        
			// If an error was thrown during the GetInputStage, log the error.
			if (summary.inputSummary.error) {
				log.error({
					title: 'Input Error',
					details: summary.inputSummary.error
				});
			}
			
			 // check if any error returned from Map stage
			summary.mapSummary.errors.iterator().each(function (key, error){
				log.error({
					title: 'Map error for key: ' + key ,
					details: error
				});
				return true;
			});
 
		    // check if any error returned from reduce stage
			summary.reduceSummary.errors.iterator().each(function (key, error){
				log.error({
					title: 'Reduce error for key: ' + key ,
					details: error
				});
				return true;
			});
        }
        catch (err) {
				log.error("Summarize", err);
			}
			log.audit('Map / Reduce END', new Date());
		}

		return {
			getInputData: GetInputData,
			reduce: Reduce,
			summarize: Summarize
		};
	});