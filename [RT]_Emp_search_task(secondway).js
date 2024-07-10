/** 
 * @NApiVersion 2.x
 * @NScriptType Restlet
*/
/** create a saved search without any criteria in NetSuite on any record or transaction & load into script by using script parameters.
create integration record ,authentication token ,create & deploy restlet script into NS.
create postman connection with valid authorisation & pass the internal id as parameter & use it as search filter, run the search & return the result object(JSON) as response from the restlet
*/
define(['N/search','N/runtime'],
function(search,runtime)
{
    function _get(context){
        var scriptObj = runtime.getCurrentScript();
        var employeeSearch= scriptObj.getParameter({
            name:'custscript_work_search'
        });
        var internalId= scriptObj.getParameter({
            name:'custscriptinternal_id'
        });
        var mySearch = search.load({
            id: employeeSearch
        });
        mySearch.filters=[
            search.createFilter({
                name: 'internalid',
                values: internalId,
                operator: 'anyof'
            })
        ];
        mySearch.save();
        var searchCount=mySearch.runPaged().count;
         var searchResultSet=mySearch.run().getRange({
            start: 0,
            end: 1
        });
        var results=[];
        searchResultSet.forEach(function(result){
            results.push(result);
        });
        return results;
    }
    return{
        get: _get
    };

});
