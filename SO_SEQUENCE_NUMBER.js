/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
*/
define(['N/currentRecord'],
    function (currentRecord) {
        function myValidateLine(context) {
            var newRecord = context.currentRecord;
            if (context.sublistId === 'item') {
                var seriesNo = newRecord.getCurrentSublistIndex({
                    sublistId: 'item'
                });
                alert('Sequence number : ' + seriesNo);
                var newSeriesNo = seriesNo + 1;
                newRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_seq_num',
                    value: newSeriesNo
                });
            }
            return true;
        }
        return {
            validateLine: myValidateLine
        };
    }
);