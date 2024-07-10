/** 
 * @NApiVersion 2.x
 * @NScriptType Restlet
*/
define(['N/search', 'N/runtime'],
    function (search, runtime) {
        function _get(context) {
            var scriptObj = runtime.getCurrentScript();
            var employeeId = scriptObj.getParameter({ name: 'custscript_work_search' });
            var mySearch = search.load({
                id: employeeId
            });
            //log.debug('search is',mySearch);
            mySearch.filters = [
                search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: context.internalid
                })
            ];
            //mySearch.save();
            var Count = mySearch.runPaged().count;
            log.debug('count is', Count);
            var searchresults = mySearch.run().getRange({
                start: 0,
                end: 1
            });
            log.debug('Search results Count:', searchresults);
            var result = {};
            for (var i = 0; i < Count; i++) {
                var internalId = searchresults[i].getValue('internalid');
                var name = searchresults[i].getValue('entityid');
                var email = searchresults[i].getValue('email');
                var phone = searchresults[i].getValue('phone');
                var results = [];
                result = {
                    'internalId': internalId,
                    'name': name,
                    'email': email,
                    'phone': phone
                };
                results.push(result);
                log.debug('Results:', result);
            }
            return results;
        }
        return {
            get: _get
        };
    });
