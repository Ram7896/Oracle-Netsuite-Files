/**
*@NApiVersion 2.x
*@NScriptType UserEventScript
*/
define(['N/record', 'N/runtime', 'N/email'],
	function (record, runtime, email) {
		function beforeLoad(context) {
			try {
				var recordObj = context.newRecord;

				log.debug('recordObj=', recordObj);
				log.debug({
					title: 'Debug Entry',
					details: 'beforeLoad Triggered'//In Execution log we know triggering purpose used
				});


				//set  Approval status internal id = 2
				recordObj.setValue({
					fieldId: 'orderstatus',
					value: 'B',
					ignoreFieldChange: true
				});

			}
			catch (e) {
				log.error({
					title: 'Error Code',
					details: e
				});
			}
		}

		function beforeSubmit(context) {
			try {
				var recordObj2 = context.newRecord;
				log.debug({
					title: 'Debug Entry',
					details: 'beforeSubmit Triggered'//In Execution log we know triggering purpose used
				});
				var totalAmount = recordObj2.getValue({
					fieldId: 'total',
				});
				log.debug({
					title: 'totalAmount',
					details: totalAmount
				});
				var tot_val_string2 = 'In Before Submit Value=' + totalAmount;
				recordObj2.setValue({
					fieldId: 'memo',
					value: tot_val_string2,
					ignoreFieldChange: true
				});
				if (totalAmount > 100 && totalAmount < 900) {//totalamount is greater than 100 and less than 900 set approval status rejected
					log.debug('totalAmount 1', totalAmount);

					recordObj2.setValue({
						fieldId: 'orderstatus',
						value: 'B'//rejected
					});
				}
				//log.debug("poRecordId=", poRecordId);
			}
			catch (e) {
				log.error({
					title: 'Error code',
					details: e
				});
			}
		}
		function afterSubmit(context) {
			try {
				var recordObj = context.newRecord;
				log.debug({
					title: 'Debug Entry',
					details: 'afterSubmit Triggered'
				});
				var RecordId = recordObj.id;
				//PO type
				var type = recordObj.type;

				var objRecord = record.load({
					type: record.Type.SALES_ORDER,
					id: RecordId,
					isDynamic: true
				});
				var total_value = objRecord.getValue({
					fieldId: 'total'//fieldid
				});
				var complete_Str = 'After Submit =' + total_value;
				objRecord.setValue({
					fieldId: 'memo',
					value: complete_Str,//In memo field displays total value after submit
					ignoreFieldChange: true
				});
				var recordId = objRecord.save({
					enableSourcing: true,
					ignoreMandatoryFields: true
				});
				log.debug('recordId', recordId);
				var currentUser = runtime.getCurrentUser();
				log.debug('currentUser', currentUser);
				if (context.type === context.UserEventType.CREATE) {
					log.debug('context.type entered');
					var senderId = currentUser.id;
                    log.debug('sender id:',senderId);
					var recipientId = currentUser.id;
					email.send({
						author: senderId,
						recipients: recipientId,
						subject: 'Testing Email Module',//send a mail
						body: 'email body'
					});
				}
			} catch (e) {
				log.error({
					title: 'Error Code',
					details: e
				});
			}
		}
		return {
			beforeLoad: beforeLoad,
			beforeSubmit: beforeSubmit,
			afterSubmit: afterSubmit
		};
	}
);