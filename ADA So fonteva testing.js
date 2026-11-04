/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/file', 'N/search', 'N/log'], function (file, search, log) {

    function getInputData() {
        try {
            var folderId = '336907';
            var fileSearch = search.create({
                type: "file",
                filters: [
                    ["folder", "anyof", folderId]
                ],
                columns: ['internalid']
            });

            var fileSearchResult = fileSearch.run().getRange({
                start: 0,
                end: 1000
            });
         return fileSearchResult;
            

        } catch (e) {
            log.error({
                title: 'Error in getinputdata',
                details: e
            });
        }
    }

    function map(context) {
        try {
            //log.debug("Context:", context);
            var fileId = JSON.parse(context.value);
            //log.debug("FIle Id:", fileId);
            var file_internalid = fileId.id;
            var fileObj = file.load({
                id: file_internalid
            });
            var fileContents = fileObj.getContents();
            //log.debug("fileContents:", fileContents);
            var splitcells = fileContents.split('\n');
            //log.debug("split", splitcells);
            //log.audit("split length", splitcells.length);
            for (var i = 1; i < splitcells.length - 1; i++) 
            {
                var cells = splitcells[i].split(',').map(cell => cell.trim());
                log.debug("Cells:", cells);
                context.write({
                    key: cells[4],
                    value: cells
                });
            }
        } catch (e) {
            log.debug("Error in Map:", e);
        }
    }

    function reduce(context) {
        log.debug("context.key",context.values);
        //log.debug("context.value",context.value);
        var salesOrderJSON = {};
        for(var i=0;i<context.values.length;i++){
            var output = JSON.parse(context.values[i]);
            //log.debug("Reduce output:",output.length);            
            if(i==0)
                {
                    salesOrderJSON = toBuildSOJSON(output);
                    log.debug("Sales Order JSON for I==0",salesOrderJSON);
                }
                else
                {
                    salesOrderJSON= toBuildSOJSON(output,salesOrderJSON);
                    log.debug("Sales Order JSON for I<>0",salesOrderJSON);

                }
            
        }
    }

    function summarize(summary) {
        log.audit({
            title: 'Final Output',
            details: summary.inputSummary
        });
    }

    function toBuildSOJSON(cells,salesOrderJSON)
    {
        try{
            var salesOrder;
            if(salesOrderJSON)
            {
                salesOrder = salesOrderJSON;
                var soItemdetailsarray=[]
                soItemdetailsarray=salesOrder.itemDetails;
                log.debug("soItemdetailsarray",soItemdetailsarray);
                soItemdetailsarray.push({
                    "ExternalLineID":cells[21],
                    "ItemName/Number":cells[22],
                    "Quantity":cells[23],
                    "UnitPrice":cells[24].replace(/[^\d.]/g, ''),
                    "Amount":cells[25].replace(/[^\d.]/g, ''),
                    "IsTax":cells[26].trim()
                });
                salesOrder.itemDetails=soItemdetailsarray;
            }
            else{

                salesOrder = {
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
                    "ShipToAttention":cells[15],
                    "ShipAddress1":cells[16],
                    "ShipCity":cells[17],
                    "ShipvState":cells[18],
                    "ShipZip":cells[19],
                    "ShipCountry":cells[20],
                    "itemDetails":[{
                        "ExternalLineID":cells[21],
                        "ItemName/Number":cells[22],
                        "Quantity":cells[23],
                        "UnitPrice":cells[24].replace(/[^\d.]/g, ''),
                        "Amount":cells[25].replace(/[^\d.]/g, ''),
                        "IsTax":cells[26].trim()
                    }]
                    
                };

            }
            
            //log.debug("Sales Order JSON",salesOrder);
            return salesOrder;

        }
        catch(e)
        {

        }
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});