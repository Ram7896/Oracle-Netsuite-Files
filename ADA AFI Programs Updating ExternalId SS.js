/*************************************************************************************************************************************
 * Script Name         :   ADA AFI Program Updating ExternalId SS
 * Author              :   Rama Sudhakar
 * Creation date       :   26th September 2025
 * Company             :   Capgemini India
 * Description         :   This script updates the externalid of AFI Programs.
 * Change Log            :   ||    Changed By         ||    Date           ||            Description
 * 
 ********************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record'],
    function (search, record) {
        // Main function that gets executed when the scheduled script runs
        function execute(context) {
            try {
                // Call the function to get departments matching the AFI program criteria
                var afiprogramresults = afiprogamSearch();
                log.debug("AFI Program Search Results:", afiprogramresults);

                // Loop through each department result
                afiprogramresults.forEach(function (results) {
                    try {
                        // Load the department record using its internal I
                        var depRecord = record.load({
                            type: 'department',
                            id: results.InternalID
                        });

                        // Get the department name from the record
                        var depName = depRecord.getValue({
                            fieldId: 'name'
                        });

                        log.debug("depName:", depName);
                        log.debug("Saved Search dep name:", results.Name);

                        // Compare the name from the saved search with the record's name
                        if (results.Name == depName) {
                            // Set the external ID to the department name
                            depRecord.setValue({
                                fieldId: 'externalid',
                                value: depName
                            });

                            // Save the updated department record
                            var depId = depRecord.save();
                            log.debug("Department Updated Successfully:", depId);
                        }
                    } catch (e) {
                        // Handle duplicate external ID error gracefully
                        if (e.name === 'USER_ERROR' && e.message.includes('This record already exists')) {
                            log.debug("Skipped - External ID already exists for:", results.InternalID + " (" + depName + ")");
                        } else {
                            // Log any other errors
                            log.error("Error processing department ID " + results.InternalID, e.message);
                        }
                    }
                });

            } catch (e) {
                log.error('Error in Schedule Script:', e.message);
            }
        }
        // Function to perform a saved search for departments matching AFI program criteria
        function afiprogamSearch() {
            var programslist = [];
            try {
                // Create a department search with specific filters
                var departmentSearchObj = search.create({
                    type: "department",
                    filters: [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["externalid", "anyof", "@NONE@"],
                        "AND",
                        ["systemnotes.name", "anyof", "21709"]
                    ],
                    columns: [
                        search.createColumn({ name: "namenohierarchy", label: "Name (no hierarchy)" }),
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
                });

                var results = departmentSearchObj.run().getRange({ start: 0, end: 1000 });
                log.debug("Results:", results);
                log.debug("Search Results Count:", results.length);
                // Process each result and push to the programs list
                if (results.length > 0) {
                    results.forEach(function (result) {
                        programslist.push({
                            Name: result.getValue({ name: "namenohierarchy" }),
                            InternalID: result.getValue({ name: "internalid" })
                        });
                    });
                }
                else {
                    log.debug("AFI Programs Are Not Found");
                }

                log.debug("Programs List:", programslist);
            } catch (error) {
                log.debug("Error in AFI Program Search:", error.message);
            }
            // Return the list of departments matching the criteria
            return programslist;
        }

        return {
            execute: execute,
        };
    });