/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/file', 'N/search', 'N/log'], function (file, search, log) {

    function getInputData() {
        var folderId = '336907';

        var salesOrders = {};

        // Search for all files in the folder
        var fileSearch = search.create({
            type: "file",
            filters:
                [
                    ["folder", "anyof", folderId]
                ],
            columns: ['internalid']
        });

        var fileSearchResult = fileSearch.run().getRange({
            start: 0,
            end: 1000
        });
        log.debug("Search result Count:", fileSearchResult.length);
        var arraySo = [];
        fileSearchResult.forEach(function (result) {
            var fileId = result.getValue({ name: 'internalid' });
            log.debug("File Ids:", fileId);
            try {
                var fileObj = file.load({
                    id: fileId
                });
                var arraydetails = [];
                var fileContents = fileObj.getContents();
                log.debug("fileContents:", fileContents);
                var splitcells = fileContents.split('\n');
                log.debug("split", splitcells);
                log.audit(
                    "split length"
                    , splitcells.length);
                for (var i = 1; i < splitcells.length - 1; i++) {
                    var cells = splitcells[i].split(',');
                    log.debug("Cells:", cells);
                    salesOrders = {
                        "amsCustomerId": cells[0],
                        "firstName": cells[1],
                        "lastName":cells[2],
                        "userEmail":cells[3],
                        "ExternalID":cells[4],
                        "ExternalTransaction#":cells[5],
                        "Date":cells[6],
                        "Memo":cells[7],
                        "EmployeeID":cells[8],
                        "BillToAttention":cells[9],
                        "BillAddress1":cells[10],
                        "BillCity":cells[11],
                        "BillState":cells[12],
                        "BillZip":cells[13],
                        "BillCountry":cells[14],
                        "ShipToAttention":cells[14],
                        "ShipAddress1":cells[15],
                        "ShipCity":cells[16],
                        "ShipvState":cells[17],
                        "ShipZip":cells[18],
                        "ShipCountry":cells[19],
                        "ExternalLineID":cells[20],
                        "ItemName/Number":cells[21],
                        "Quantity":cells[22],
                        "Unit":cells[23],
                        "Price":cells[24],
                        "Amount":cells[25],
                        "IsTax":cells[26]
                    }
                    arraydetails.push(salesOrders);
                }
                log.debug("arraydetails are",arraydetails);

            } catch (e) {
                log.error({
                    title: 'Error loading or parsing file',
                    details: e
                });
            }
        });
       // log.debug("array Output:", arraySo);
        return arraydetails;
    }

    function map(context) {
        log.debug("context:", context);
    }

    function reduce(context) {
    }

    function summarize(summary) {
        log.audit({
            title: 'Final Output',
            details: summary.inputSummary
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
