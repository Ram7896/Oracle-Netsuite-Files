/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/record', 'N/runtime'],
	function(record, runtime) {
		function execute(context) {
			try {
              	var emp_externalid = '010147';

              var load = record.load({
                type:'employee',
                id: '97888'
              });
              load.setValue({
                fieldId:'externalid',
                value: emp_externalid
              });
              var rec = load.save();
					log.debug('rec', rec);
			} catch (e) {
				log.error('error', e.toString());
			
			}
		}
		return {
			execute: execute
		};
	});