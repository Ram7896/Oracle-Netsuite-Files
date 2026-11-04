/**
 * @NApiVersion 2.1
 * @NModuleScope public
 */
define(["N/search", "N/record"], function (search, record) {
  function getRefundMethodId(mask) {
      var paymentoptionSearchObj = search.create({
        type: "paymentoption",
        filters: [
          ["formulatext: {mask}", "isnotempty", ""],
          "AND",
          ["formulatext: {mask}", "is", mask],
        ],
        columns: [
          search.createColumn({ name: "internalid", label: "Internal ID" }),
        ],
      });

      var searchResultCount = paymentoptionSearchObj.runPaged().count;
      log.debug("paymentoptionSearchObj result count", searchResultCount);

      var rfId = null;

      if (searchResultCount > 0) {
        rfId = paymentoptionSearchObj
          .run()
          .getRange({
            start: 0,
            end: 1,
          })[0]
          .getValue({ name: "internalid" });
      }
      return rfId;
  }
  return {
    getRefundMethodId: getRefundMethodId,
  };
});
