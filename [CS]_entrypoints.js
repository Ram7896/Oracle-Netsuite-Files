/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/error'],
	function (currentRecord, error) {
		function pageInit(context) {
			alert('You are in' + context.mode + 'mode'); //on top corner page it display alert you are in which mode
			if (context.mode == 'create') { //new page open displays create mode
				var currentRecObj = context.currentRecord; //it look like an main page
			}
			if (context.mode == 'copy') { //actions click on make copy it shows alert copy mode
				var currentRecObj = context.currentRecord; //look main page
			}
			if (context.mode == 'edit') { //go to edit page it displays alert edit mode
				var currentRecObj = context.currentRecord; //main page
			}
		}
		/* If PO# field is empty, then show an alert message & don’t allow user to submit the record. */
		function saveRecord(context) {
			try {
				var currentRecObj = context.currentRecord; //looks main page
				var locValue = currentRecObj.getValue({
					fieldId: 'otherrefnum' //Po# fieldid
				});
				log.debug('locValue=', locValue); //its displays script debug tab
				if (!locValue) { //#PO is empty its generate alert message 
					throw error.create({
						name: 'Alert_Po# Number',
						message: ('Please enter PO# number before saving')
					});
				}
				return true;
			} catch (error) {
				alert('Error in saveRecord:' + error.message); // it will generate alert message any error on code
			}
		}
		function validateField(context) {
			var currentRecord = context.currentRecord; //main page
			if (context.fieldId == 'otherrefnum') { //field id === #po field id inside function executes 
				var PO = currentRecord.getValue({
					fieldId: 'otherrefnum' //giving field id #po
				});
				var PO_length = PO.length; //its length of PO
				log.debug('PO_length=', PO_length); // in script debug which path given the execute that place
				if (PO_length > 10) { //length exceeds generates alert message
					alert('Character limit (10) exceeded for PO#');
				}
			}
			return true;
		}
		/*For remaining entry points add alerts on any particular sub list/field. */
		function fieldChanged(context) {
			var currentRecObj = context.currentRecord;//main page
			var sublistName = context.sublistId;//main sublist
			log.debug('sublistName', sublistName);//debugging in script page see
			var sublistFieldName = context.fieldId;//subfield name stored fieldid
			log.debug('sublistFieldName', sublistFieldName);
			if (sublistName === 'item' && sublistFieldName === 'item')
				currentRecObj.setValue({
					fieldId: 'memo',
					value: 'Item: ' + currentRecObj.getCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'item'
					}) + 'is selected'//items with internal id displayed.
				});
		}
		function validateDelete(context) {
			var currentRecord = context.currentRecord;//In main page
			var sublistName = context.sublistId;//sublistid stored in sublistname
			if (sublistName === 'item')//sublistname equal to name item
				alert('sublistName === item');
			if (currentRecord.getCurrentSublistValue({
				sublistId: sublistName,
				fieldId: 'item'
			}) === '17')/*(if we trying to remove 17 item that we unable to do)*/ {
				currentRecord.setValue({
					fieldId: 'memo',//fieldid
					value: 'Removing' + currentRecord.getCurrentSublistValue({
						sublistId: sublistName,
						fieldId: 'item'//using concatenation give value and sublist value 
					}) + 'Item'
				});
				return false;
			}
			alert('Try to Removing SAASLicense');
			return true;
		}
		function lineInit(context) {
			var currentRecObj = context.currentRecord; //main page
			var sublistName = context.sublistId; //listid stored in sublistname
			if (sublistName === 'item') //sublistname==item then generate alert
				alert('lineInit Entered');
			var item = 'SELECTED'; //declare item
			log.debug('item', item); //script page we see
			currentRecObj.setCurrentSublistValue({
				sublistId: sublistName, //sublistid
				fieldId: 'custcol_items_selected', //fieldid
				value: item//above declared value give
			});
		}
		function validateLine(context) {
			var currentRecord = context.currentRecord; //main page
			var sublistName = context.sublistId; //sublistid stored in sublistname
			if (sublistName === 'item') //sublistname=item then alert executed
				alert('Hello Customer,Click on Ok button');
			if (currentRecord.getCurrentSublistValue({
				sublistId: sublistName,
				fieldId: 'quantity'
			}) <= '3') { //value is less than 3 it shows an alert message
				alert('Quantity should be greater 3 and not equal to 3 ');
				return false;
			}
			return true;
		}
		function postSourcing(context) {
			var currentRecord = context.currentRecord;//main page
			var sublistName = context.sublistId;//sublistid stored in sublistname
			var sublistFieldName = context.fieldId;//fielded stored in subfieldname
			var line = context.line;
			if (sublistName === 'item' && sublistFieldName === 'item') {//both conditions true inside executes
				var item_val = currentRecord.getCurrentSublistValue({
					sublistId: sublistName,
					fieldId: sublistFieldName
				});
				log.debug('item_val', item_val);
				if (item_val === '345')//sublist item ==345 it generates an alert message
					alert('item_val===345');
				var price_lv = currentRecord.getCurrentSublistValue({
					sublistId: sublistName,
					fieldId: 'price'
				});
				log.debug('price_lv', price_lv);
				if (price_lv !== '4')//items price level not equal to 4 its set the price level to4
					currentRecord.setCurrentSublistValue({
						sublistId: sublistName,
						fieldId: 'price',
						value: '4'
					});
			}
		}
		function validateInsert(context) {
			var currentRecObj = context.currentRecord;  //current record stored in currentrecobj    
			log.debug('validateInsert');//in script page debug level displays validateinsert  
			alert('validate inserting ');  //displays an alert message
			var sublistName = context.sublistId;
			if (sublistName === 'item')
				alert('items are selected');
			if (currentRecObj.getCurrentSublistValue({
				sublistId: sublistName,
				fieldId: 'quantity'
			}) >= '10')  //quantity is less than 10 it displays alert message then enter higher value
			{
				alert('Quantity should be >10 <<>>10 also ');  //it will generate alert message value greater want insert this popup displayed
				return false;
			}
			return true;
		}
		return {
			pageInit: pageInit,
			saveRecord: saveRecord,
			validateField: validateField,
			fieldChanged: fieldChanged,
			validateDelete: validateDelete,
			lineInit: lineInit,
			validateLine: validateLine,
			postSourcing: postSourcing,
			validateInsert: validateInsert

		};
	}
);  
