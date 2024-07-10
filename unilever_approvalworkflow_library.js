/**
 * unilever_approvalworkflow_library.js
 * @NApiVersion 2.x
 * @NModuleScope Public
 */
define(['N/https'],
 
function(https) {

    function onFull(context) {
        console.log(context);
        return {
            full: onFull
        };
    }

    return {
        onFull: onFull
    };
});
