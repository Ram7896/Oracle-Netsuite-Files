/**
 * Display_message_viewmode_library.js
 * @NApiVersion 2.x
 * @NModuleScope Public
 */
define(['N/ui/message'],
 
function(message) {

    function onFull(context) {
        context.form.addPageInitMessage({
            type: message.Type.WARNING,
            message: 'missing the memo value'
            });
        return context;
    }

    return {
        onFull: onFull
    };
});