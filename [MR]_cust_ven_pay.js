/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error'],
    function (search, record, email, runtime, error) {
        function getInputData(context) {
            try {
                log.debug("context;", context);
                var currentscript = runtime.getCurrentScript();
                var string = currentscript.getParameter({
                    name: 'custscriptcustpage_map'
                });
                log.debug('String:', string);
                var results = JSON.parse(string);
                log.debug('results:', results);
                var id = results.internalid;
                log.debug('internalid:', id);
                var Memo = results.memo;
                log.debug('memo:', Memo);
                var Type = results.type;
                log.debug('Type:', Type);
                var Amount = results.amount;
                log.debug('Amount:', Amount);
                //return results;
                var objRecord = record.transform({
                    fromType: 'vendorbill',
                    fromId: id,
                    toType: 'vendorpayment',
                    isDynamic: false,
                });
                var saverecord = objRecord.save();
                log.debug({
                    title: 'Payment created:',
                    details: 'Payment Id:' + saverecord + 'vendor id:' + id
                });
            }
            catch (e) {
                log.error({
                    title: 'Error in payment creation:',
                    details: 'Invoice id:' + id + ',Message:' + e.message
                });
            }
        }
        function map() {
            try { }
            catch (e) { }
        }
        return {
            getInputData: getInputData,
            map: map
        };
    });
