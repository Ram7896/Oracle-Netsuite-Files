/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/search', 'N/http'],
  function (ui, search, http) {

    function onRequest(context) {
      try {
        
        log.debug('onrequest entered');
        // Create the form
        var form = ui.createForm({
          title: 'Vendor Transactions',
          hideNavBar: false
        });
        // Add the vendor name field
        var vendorField = form.addField({
          id: 'custpage_vendor_name',
          type: ui.FieldType.SELECT,
          label: 'Vendor Name',
          source: 'vendor'
        });
        vendorField.isMandatory = true;
        log.debug('vendorfield', vendorField);
        // Add the subsidiary field
        var subsidiaryField = form.addField({
          id: 'custpage_subsidiary',
          type: ui.FieldType.SELECT,
          label: 'Subsidiary',
          source: 'subsidiary'
        });
        subsidiaryField.isMandatory = true;
        // Add the date range fields
        var fromDateField = form.addField({
          id: 'custpage_from_date',
          type: ui.FieldType.DATE,
          label: 'From Date'
        });
        fromDateField.isMandatory = true;
        var toDateField = form.addField({
          id: 'custpage_to_date',
          type: ui.FieldType.DATE,
          label: 'To Date'
        });
        toDateField.isMandatory = true;
        form.clientScriptModulePath = './[SU]_VendorTask_CS.js';
        var sublist = form.addSublist({
          id: 'custpage_results',
          type: ui.SublistType.LIST,
          label: 'Results'
        });

        sublist.addField({
          id: 'custpage_apply',
          type: ui.FieldType.CHECKBOX,
          label: 'Apply'
        });
        sublist.addField({
          id: 'custpage_date',
          type: ui.FieldType.DATE,
          label: 'Date'
        });
        sublist.addField({
          id: 'custpage_transaction_type',
          type: ui.FieldType.TEXT,
          label: 'Transaction Type'
        });
        sublist.addField({
          id: 'custpage_document_number',
          type: ui.FieldType.TEXT,
          label: 'Document Number'
        });
        sublist.addField({
          id: 'custpage_amount',
          type: ui.FieldType.CURRENCY,
          label: 'Amount'
        });
        sublist.addField({
          id: 'custpage_currency',
          type: ui.FieldType.TEXT,
          label: 'Currency'
        });
        sublist.addField({
          id: 'custpage_document_status',
          type: ui.FieldType.TEXT,
          label: 'Document Status'
        });
        log.debug('sublist fields added sucessfully');
        log.debug('form created sucessfully');
        if (context.request.method === 'POST') {
          // Get the form data
          var vendorName = context.request.parameters.custpage_vendor_name;
          log.debug('vendor Id', vendorName);
          var subsidiaryId = context.request.parameters.custpage_subsidiary;
          log.debug('subsidiary', subsidiaryId);
          var fromDate = context.request.parameters.custpage_from_date;
          log.debug('fromDate', fromDate);
          var toDate = context.request.parameters.custpage_to_date;
          log.debug('todate', toDate);
          log.debug('get the data sucessfully');
          if (vendorName) {
            vendorField.defaultValue = vendorName;
          }
          if (subsidiaryId) {
            subsidiaryField.defaultValue = subsidiaryId;
          }
          if (fromDate) {
            fromDateField.defaultValue = fromDate;
          }
          if (toDate) {
            toDateField.defaultValue = toDate;
          }
          // Create the search
          var transactionSearch = search.create({
            type: search.Type.TRANSACTION,
            filters: [
              ['name', 'anyof', vendorName],
              'AND',
              ['subsidiary', 'anyof', subsidiaryId],
              'AND',
              ['type', 'anyof', 'VendBill', 'PurchOrd', 'Journal', 'ItemRcpt', 'VendPymt'],
              'AND',
              ['trandate', 'within', fromDate, toDate],
              'AND',
              ['mainline', 'is', 'T']
            ],
            columns: [
              /*search.createColumn({
                name: 'internalid',
                label: 'Apply',
                type: search.Type.CHECKBOX
              }),*/
              search.createColumn({
                name: 'trandate',
                label: 'Date',
                type: search.Type.DATE
              }),
              search.createColumn({
                name: 'mainline',
                label: '*'
              }),
              search.createColumn({
                name: 'type',
                label: 'Transaction Type'
              }),
              search.createColumn({
                name: 'tranid',
                label: 'Document Number'
              }),
              search.createColumn({
                name: 'amount',
                label: 'Amount'
              }),
              search.createColumn({
                name: 'currency',
                label: 'Currency'
              }),
              search.createColumn({
                name: 'status',
                label: 'Document Status'
              })
            ]
          });
          log.debug('filters an cloumns created sucessfully');
          // Run the search and display the results
          var results = transactionSearch.run().getRange({
            start: 0,
            end: 1000
          });
          for (var i = 0; i < results.length; i++) {
            var result = results[i];
            var doc_num = result.getValue({ name: 'tranid' });
            var status = result.getValue({ name: 'status' });
            var date = result.getValue({ name: 'trandate' });
            var transcation = result.getValue({ name: 'type' });
            var amount = result.getValue({ name: 'amount' });
            var currency = result.getValue({ name: 'currency' });
            /*sublist.setSublistValue({
              id: 'custpage_apply',
              line: i,
              value: result.getValue({ name: 'internalid' })
            });*/
            sublist.setSublistValue({
              id: 'custpage_date',
              line: i,
              value: date
            });
            sublist.setSublistValue({
              id: 'custpage_transaction_type',
              line: i,
              value: transcation
            });
            log.debug('transcation type triggered');
            if (!!doc_num) {
              sublist.setSublistValue({
                id: 'custpage_document_number',
                line: i,
                value: doc_num
              });
            }
            sublist.setSublistValue({
              id: 'custpage_amount',
              line: i,
              value: amount
            });
            sublist.setSublistValue({
              id: 'custpage_currency',
              line: i,
              value: currency
            });
            log.debug('currency triggered');
            if (!!status) {
              sublist.setSublistValue({
                id: 'custpage_document_status',
                line: i,
                value: status
              });
            }
          }
          log.debug('values set and get sucessfully');
        }
        // Add submit button and submit script
        form.addSubmitButton({
          label: 'Search'
        });
       form.addButton({
          label: 'Send mail',
          id: 'custpage_button',
          functionName: 'sendEmail'
        });
        log.debug('email button triggered');
        // Display the form
        context.response.writePage(form);
        log.debug('form displayed successfully');

      }
      catch (error) {
        log.debug('Error in suitelet', error);
      }
    }
    return {
      onRequest: onRequest
    };
  });