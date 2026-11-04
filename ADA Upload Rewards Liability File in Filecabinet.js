/*************************************************************************************************************************************
 * Script Name			:	ADA Upload Rewards Liability File SS
 * Author   			  :	Rama Sudhakar 
 * Creation date		:	28th March 2025
 * Company	  			:	Capgemini India
 * Description			:	This script creates a CSV file in the File Cabinet and a custom record in NetSuite.
 * Change Log	  		:	||    Changed By    ||    Date     ||            Description           ||
                     ||
 *************************************************************************************************************************************/
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/file', 'N/record', 'N/runtime', 'N/url'],
    function (serverWidget, file, record, runtime, url) {

        function onRequest(context) {
            try {
                const currentScript = runtime.getCurrentScript();
                //Get script parameter values.
                const rewardLiabilityFolderId = currentScript.getParameter({
                    name: "custscript_reward_liability_folder",
                });
                log.debug("Reward Liability Folder Id:", rewardLiabilityFolderId);
                if (context.request.method === 'GET') {
                    var form = serverWidget.createForm({
                        title: 'Upload Rewards Liability File'
                    });

                    // Document Upload Field
                    var fileField = form.addField({
                        id: 'custpage_upload_file',
                        type: serverWidget.FieldType.FILE,
                        label: 'Upload Rewards Liability File'
                    });
                    fileField.isMandatory = true;
                    // Journal Date Field
                    let journalDate = form.addField({
                        id: 'custpage_journal_date',
                        type: serverWidget.FieldType.DATE,
                        label: 'Journal Date'
                    });
                    journalDate.isMandatory = true;
                    // Journal Name Field
                    let journalName = form.addField({
                        id: 'custpage_journal_name',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Journal Name'
                    });
                    journalName.isMandatory = true;
                    // Submit Button
                    form.addSubmitButton({
                        label: 'Submit'
                    });

                    context.response.writePage(form);

                } else if (context.request.method === 'POST') {
                    let uploadedFile = context.request.files.custpage_upload_file;
                    log.debug("Uploaded File:", uploadedFile);
                    let journalDate = context.request.parameters.custpage_journal_date;
                    log.debug("Journal Date:", journalDate);
                    let journalName = context.request.parameters.custpage_journal_name;
                    if (uploadedFile) {
                        uploadedFile.folder = rewardLiabilityFolderId;
                        let fileId = uploadedFile.save();

                        // Create Custom Record
                        var customRecord = record.create({
                            type: 'customrecord_ada_load_rewards_liability'
                        });

                        customRecord.setValue({
                            fieldId: 'custrecord_ada_rewards_liability_csvfile',
                            value: fileId
                        });

                        customRecord.setValue({
                            fieldId: 'custrecord_rl_file_id',
                            value: fileId
                        });

                        customRecord.setValue({
                            fieldId: 'custrecord_ada_rewards_liability_je_date',
                            value: new Date(journalDate)
                        });

                        customRecord.setValue({
                            fieldId: 'custrecord_ada_rewards_liability_je_name',
                            value: journalName
                        });

                        var recordId = customRecord.save();
                        log.debug('Success', 'File ID: ' + fileId + ', Record ID: ' + recordId);

                        // Get Suitelet URL to reload the page
                        let suiteletUrl = url.resolveScript({
                            scriptId: runtime.getCurrentScript().id,
                            deploymentId: runtime.getCurrentScript().deploymentId
                        });

                        // Reload the page and show success alert
                        context.response.write(`
                        <script>
                            alert("Rewards Liability File Uploaded Successfully");
                            window.location.href = "${suiteletUrl}";
                        </script>
                    `);
                    }
                }
            }
            catch (error) {
                log.debug("Error in Suitelet:", error.message);
            }
        }

        return {
            onRequest: onRequest
        };
    });