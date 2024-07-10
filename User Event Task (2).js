/**
*@NApiVersion 2.x
*@NScriptType UserEventScript
*/
define(['N/record','N/runtime','N/email','N/file','N/render'],
	function(record,runtime,email,file,render) {
		function beforeLoad(context) {
			try{
				var recordObj = context.newRecord;
				
				log.debug('recordObj=',recordObj);
				log.debug({
					title:'Debug Entry',
					details:'beforeLoad Triggered'
				});
				
				
				//set  Approval status internal id = 2
				recordObj.setValue({
					fieldId:'approvalstatus',
					value:'2', 
					ignoreFieldChange: true
				});
			
			}
			catch(e) {
				log.error({
					title:'Error Code',
					details:e
				});	
			}
		}
		
	//before load close
	//in before submit no need to load and save the record because current record object 
	//record not saved so record id not generated
	function beforeSubmit(context) {
		try{
			var recordObj2 = context.newRecord;
			log.debug({
				title:'Debug Entry',
				details:'beforeSubmit Triggered'
			});
			var totalAmount = recordObj2.getValue({
				fieldId:'total',
			});
			log.debug({
				title:'totalAmount',
				details:totalAmount
			});
			var tot_val_string2='In Before Submit Value='+totalAmount;
			recordObj2.setValue({
				fieldId:'memo',
				value:tot_val_string2,
				ignoreFieldChange:true
			});
			if(totalAmount>100 && totalAmount<900){
				log.debug('totalAmount 1',totalAmount);
				
				recordObj2.setValue({
					fieldId:'approvalstatus',
					value:'3'//rejected
				});
			}
			log.debug("poRecordId=",poRecordId);
		}
		catch (e){
			log.error({
				title:'Error code',
				details:e
			});
		}
	}
		function afterSubmit(context) {
			try{
			if (context.type === context.UserEventType.CREATE) {
      
			// Get the Purchase Order record and vendor email
			var purchaseOrder = context.newRecord;
			var vendorId = purchaseOrder.getValue({fieldId: 'entity'});
			var vendorEmail = record.load({
				type: record.Type.VENDOR,
				id: vendorId
			}).getValue({fieldId: 'email'});
      
		// Render the PDF file
		var renderer = render.create();
		renderer.templateId = 4; // Replace with the ID of your PDF template
		renderer.addRecord('record', purchaseOrder);
		var fileObj = file.create({
		name: 'test.pdf',
		fileType: file.Type.PDF,
		});
		fileObj.folder = 755;
		var fileId = fileObj.save();
		// Send the email with the PDF attachment
			email.send({
				author: purchaseOrder.getValue({fieldId: 'employee'}),
				recipients: vendorEmail,
				subject: 'Purchase Order ' + purchaseOrder.getValue({fieldId: 'tranid'}),
				body: 'Please find the attached Purchase Order.',
				attachments: [fieldId],
				relatedRecords: {
				transactionId: purchaseOrder.id,
				transactionType: purchaseOrder.type
			}
      });
	}

		}catch(e) {
				log.error({
					title:'Error Code',
					details:e
				});
			}
		} 
		return{
			beforeLoad:beforeLoad,
		    beforeSubmit:beforeSubmit,
			afterSubmit:afterSubmit
		};
	}
);