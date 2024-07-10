/** 
*@NApiVersion 2.x
*@NScriptType ClientScript
*/
define(['N/currentRecord', 'N/search', 'N/record'],
    function (currentRecord, search, record) {
        function pageInit(context) {
            alert('entered');
        }
        function markAll() {
            alert('entered');
            var objRecord = currentRecord.get();
            var lineCount = objRecord.getLineCount({ 
                sublistId: 'custpage_results'
            });
            alert('lineCount' + lineCount);
            for (var i = 0; i < lineCount; i++) {
                alert('lineCount[i]' + i);
                objRecord.selectLine({ 
                    sublistId: 'custpage_results',
                    line: i
                });
                objRecord.setCurrentSublistValue({ 
                    sublistId: 'custpage_results',
                    fieldId: 'custpage_checkbox',
                    value: true
                });
                objRecord.commitLine({ 
                    sublistId: 'custpage_results'
                });
            }
        }
        function unmarkAll() {
            alert('entered');
            var objRecord = currentRecord.get();
            var lineCount = objRecord.getLineCount({ 
                sublistId: 'custpage_results'
            });
            alert('lineCount' + lineCount);
            for (var i = 0; i < lineCount; i++) {
                alert('lineCount[i]' + i);
                objRecord.selectLine({
                    sublistId: 'custpage_results',
                    line: i
                });
                objRecord.setCurrentSublistValue({ 
                    sublistId: 'custpage_results',
                    fieldId: 'custpage_checkbox',
                    value: false
                });
                objRecord.commitLine({ 
                    sublistId: 'custpage_results'
                });
            }
        }
        function refresh() {
            location.reload();
        }
        return {
            pageInit: pageInit,
            markAll:markAll,
            unmarkAll:unmarkAll,
            refresh:refresh
        };
    }
);