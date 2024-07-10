/**
*@NApiVersion 2.x
*@NScriptType  ScheduledScript
*/
define(['N/search', 'N/record', 'N/runtime'],
  function (search, record, runtime) {
    function execute(context) {
      var runtimesample = runtime.getCurrentScript().deploymentId;
      if (runtimesample == 'customdeploycustomdeploy_scheduled_task') {
        try {

          var employeeSearch = search.create({
            type: "employee",
            filters:
            [
               ["isinactive","is","F"]
            ],
            columns:
            [
               search.createColumn({name: "firstname"}),
               search.createColumn({name: "email"}),
               search.createColumn({name: "supervisor"}),
               search.createColumn({name: "title"})
            ]
          });
          var searchResultSet = employeeSearch.run().getRange({
            start: 0,
            end: 1000
          });
          log.debug('search created successfully');
          for (var index = 0; index < searchResultSet.length; index++) {
            var Name = searchResultSet[index].getValue('firstname');
            log.debug('Name:',Name);
            var Job_tit = searchResultSet[index].getValue('title');
            log.debug('Job_title:',Job_tit);
            var Email_add = searchResultSet[index].getValue('email');
            log.debug('Email_add:',Email_add);
            var FSupervisors = searchResultSet[index].getValue('supervisor');
            log.debug('Supervisiors:',FSupervisors);
            var customRecord = record.create({
              type: 'customrecordcustomrecord_track_employee'
            });
           var SetName= customRecord.setValue({
              fieldId: 'custrecord1',
              value: Name
            });
            var SetJob_tit=customRecord.setValue({
              fieldId: 'custrecord2',
              value: Job_tit
            });
             customRecord.setValue({
              fieldId: 'custrecord3',
              value: Email_add
            });
            var SetSupervisior=customRecord.setValue({
              fieldId: 'custrecord4',
              value: FSupervisors
            });
            var custRecord = customRecord.save({
              enablesourcing: true,
              ignoreMandatoryFields: true
            });
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
						subject: 'Testing Email Module',
						body: 'Name:'+SetName+'Job_tit:'+SetJob_tit+'Supervisior:'+SetSupervisior
					});
				}
          }
        } catch (error) {
          log.error('Error in scheduled script assignment ', error);
        }
      }

      try {
        if (runtimesample == 'customdeploycustomdeployshueduletask_del') {
          var recordType = 'customrecordcustomrecord_track_employee';
          var searchResult = search.create({
            type: recordType
          });
          var searchResultSet = searchResult.run().getRange({
            start: 0,
            end: 1000
          });
          while (searchResultSet.length > 0) {
            for (var i = 0; i < searchResultSet.length; i++) {
              var recordId = searchResultSet[i].id;
              record.delete({
                type: recordType,
                id: recordId
              });

            }

          }
          return true;
        }
      }
      catch (error) {
        log.error('Error in deletion', error);
      }
    }
    return {
      execute: execute
    };
  }
);
