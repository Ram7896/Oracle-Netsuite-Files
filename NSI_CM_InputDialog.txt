/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 */

/**
 * @file An input dialog utility to capturing user input and optionally writing it directly a form field.
 * @copyright Copyright (c) 2020 - 2022 SMASH ICT.
 * @see {@link https://netsuite-insights.com/netsuite-input-dialog/|Blog Article}
 *
 * @license MIT (https://opensource.org/licenses/MIT)
 * @date    2020-11-08
 * @version 2.0.0
 */
// Version History
// v2.0.1   2022-05-11  (Chidi Okwudire) 
// - Removed dependency on internal N/utilityFunctions module as it caused errors in some cases. 
//
// v2.0.0   2022-04-06  (Chidi Okwudire)  
// - Moved away from injecting script in button HTML as  NetSuite stopped supporting that with the 2022.1 release.
//   We replicate/tweak NetSuite's internal dialog logic and a custom event handler instead.


define(['N/error'],

function(error) {
    ////////////////////////////////////////////////////
    /// Copied from NetSuite's client-side dialog.js ///

    // sourceURL=suitescript/resources/javascript//dialog.js
    // Adapted to intercept event handler on button click

    var DEFAULT_BUTTON_LABEL = "OK";
    var DEFAULT_BUTTON_VALUE = true;

    function prepareOptions(options)
    {
        var title = "", message = "";
        if (options !== undefined)
        {
            title = options.hasOwnProperty("title") ? options.title : "";
            message = options.hasOwnProperty("message") ? options.message : "";
        }

        return {title: title, message: message};
    }

    function prepareButtons(options)
    {
        var rawButtons;
        if ((options === undefined) || (options === null) || !options.hasOwnProperty("buttons"))
            rawButtons = [];
        else
            rawButtons = options.buttons;

        if (!util.isArray(rawButtons)) {
            //utilityFunctions.throwSuiteScriptError(error.Type.WRONG_PARAMETER_TYPE);
            throw error.create({
                name: 'WRONG_PARAMETER_TYPE',
                message: 'Expected an array but got ' + typeof rawButtons
            });
        }

        if (rawButtons.length === 0)
            rawButtons = [{label: DEFAULT_BUTTON_LABEL, value: DEFAULT_BUTTON_VALUE}];

        return rawButtons;
    }

    function craftButtons(options)
    {
        var buttons = prepareButtons(options);
        var buttonList = [];

        for (var i = 0; i < buttons.length; i++)
        {
            var thisButton = buttons[i];
            if (!thisButton.hasOwnProperty("label") || !thisButton.hasOwnProperty("value")) {
                //utilityFunctions.throwSuiteScriptError(error.Type.BUTTONS_MUST_INCLUDE_BOTH_A_LABEL_AND_VALUE);
                throw error.create({
                    name: 'BUTTONS_MUST_INCLUDE_BOTH_A_LABEL_AND_VALUE',
                    message: 'Buttons must include both a label and value.'
                });
            }

            buttonList.push(new NS.UI.Messaging.Button({
                label: thisButton.label,
                value: thisButton.value,
                onClick: thisButton.onClick /* <-- NSI insertion */ || function (event) { event.dialog.close(event); }
            }));
        }
        return buttonList;
    }

    function doDialog(options, dialogType)
    {
        //var msg = {source: 'dialog.' + dialogType, data: options, reply: null};
        var finalOptions = prepareOptions(options);

        //var messageQueue = msgRouter.getActiveQueue();

        // // server side or remote record
        // if (typeof(NS) === 'undefined' ||
        //     typeof(NS.UI) === 'undefined' ||
        //     typeof(NS.UI.Messaging) === 'undefined') {

        //     if (dialogType === 'dialog') {
        // 	    finalOptions.buttons = prepareButtons(options);
        //     }
        //     msg.reply = messageQueue.getAutoResponse({dialogType: dialogType, dialogOptions: finalOptions});
        //     messageQueue.storeMessage(msg);
        //     return msg.reply;
        //     // TODO: change ret value to promise once its defined on the server so the return type is same as on client
        // }
        // // client side
        // else {
            var creatorFunction;
            if (dialogType === 'dialog') {
                creatorFunction = NS.UI.Messaging.Dialog;
                finalOptions.buttons = craftButtons(options);
            }
            else if (dialogType === 'confirm') {
                creatorFunction = NS.UI.Messaging.Confirm;
            }
            else if (dialogType === 'alert') {
                creatorFunction = NS.UI.Messaging.Alert;
            }

            return new Promise(function (resolve, reject) {
                try {
                    finalOptions.onClose = function (event) {
                        var result = event.button.value;
                        // msg.reply = result;
                        // messageQueue.storeMessage(msg);
                        resolve(result);
                    };
                    var myDialog = new creatorFunction(finalOptions);
                    myDialog.open();
                }
                catch (e) {
                    reject(e);
                }
            });
        // }
    }

    ///         End of NS dialog.js functions        ///
    ////////////////////////////////////////////////////

    /**
     * A utility class extending NetSuite's N/ui/dialog module with the ability to capture user input.
     * @exports NSI/InputDialog
     * @namespace InputDialog
     */
    function InputDialog(options) {
        var _options;

        _parseOptions(options);

        /// Private functions ////
        /*
         * A console.log wrapper. Only logs if the debug=t parameter is specified in the page's URL.
         * @param {*} val The value to be logged.
         */
        function _log(val) {
            if ((window.location.search || '').toLowerCase().indexOf('debug=t') >= 0) {
                console.log(val);   
            }
        }

        /*
         * Parses the inputs, setting up default values and performing validations as per specs.
         * @param {object} [input] The input dialog options to be parsed.
         */
        function _parseOptions(input) {
            _log('Options before processing: ' + JSON.stringify(input));

            var options = {};
            if (input) {
                options = JSON.parse(JSON.stringify(input)); // Deep copy
            } 
        
            if (!options.textarea) {
                options.textarea = {};
            }
        
            if (!Array.isArray(options.buttons) || options.buttons.length < 1) {
                options.buttons = [{ label: DEFAULT_BUTTON_LABEL, value: DEFAULT_BUTTON_VALUE }];
            }

            var rows = parseInt(options.textarea.rows)
            if (isNaN(rows) || rows <= 0) {
                options.textarea.rows = 5;
            }

            var cols = parseInt(options.textarea.cols)
            if (isNaN(cols) || cols <= 0) {
                options.textarea.cols = 40;
            }

            if (options.textarea.initialValue == null) {
                options.textarea.initialValue = '';
            }

            if (options.textarea.isMandatory == null) {
                options.textarea.isMandatory = false;
            }

            if (options.textarea.caption == null) {
                options.textarea.caption = '';
            }

            if (options.textarea.isMandatory) {
                if (options.textarea.caption === '') {
                    options.textarea.caption = 'Input field';
                }

                options.textarea.caption += ' *';
            }

            var actionButtons = options.textarea.actionButtons
            if (!Array.isArray(actionButtons)) {
                options.textarea.actionButtons = [];
            } else {
                // Make sure that the specified action buttons are valid.
                var index, button;
                var tmpArr = actionButtons.splice();
                for (var i = 0; i < options.buttons.length; ++i) {
                    button = options.buttons[i]
                    index = tmpArr.indexOf(button.value)
                    _log('Button: ' + JSON.stringify(button) + ' | Action button index: ' + index)
                    if (index >= 0) {
                        tmpArr.splice(index, 1);
                    }
                }

                if (tmpArr.length !== 0) {
                    throw 'The following action button(s) do not match any of the input button values: ' + JSON.stringify(tmpArr);
                }
            }

            _log('Options after processing: ' + JSON.stringify(options))
            _options = options;
        }

        /*
         * Custom event handler for button clicks, allowing us capture and process the additional inputs.
         * @param {Object} event 
         */
        function _onClick(event) {
            var buttonId = event.button.value
            _log(arguments.callee.name + 'Button clicked! Value: ' + buttonId);

            var canClose = true;
            var text = '';
            window.nsiInputFieldValue = '';

            // Parse input only when clicked button is an action button.
            if (_options.textarea.actionButtons.length === 0 || _options.textarea.actionButtons.indexOf(buttonId) >= 0) {
                text = (jQuery("#nsi-inputdialog-textarea").val() || '').trim();
                _log(arguments.callee.name + ' Text: ' + text + ' | options: ' + JSON.stringify(_options));

                if (_options.textarea.isMandatory && !text) {
                    canClose = false;
                    // We use an alert here for a consistent experience as NetSuite uses this approach to validate mandatory fields.
                    alert("Please enter a value in the mandatory input text field.");
                } else {
                    if (_options.textarea.fieldId) {
                        nlapiSetFieldValue(_options.textarea.fieldId, text);
                    }
                    // Store the result in a global variable for access later.
                    window.nsiInputFieldValue = text;
                }
            }

            if (canClose) {
                event.dialog.close(event);
            }
        }

        /*
         * Generates HTML for the input dialog's text area.
         */
        function _buildBody() {
            var output = '';
            if (_options.message) {
                output += '<p>' + _options.message + '</p><br/>';
            }

            const textarea = _options.textarea;
            if (textarea.caption) {
                output += '<span class="smallgraytext uir-label">'+ textarea.caption.toString().toUpperCase() + '</span><br/>';
            }

            output += '<textarea id="nsi-inputdialog-textarea" rows="' + textarea.rows + '" cols="' + textarea.cols + '">' + textarea.initialValue + '</textarea>';
            return output;
        }


        /// Privileged functions ///
         /*
         * Creates the actual input dialog including the HTML used to decorate the native
         * NetSuite dialog with input capturing capabilities.
         */
        this.build = function () {
            var htmlMessage = _buildBody();

            // Inject a custom click listener for each button
            for (var i = 0; i < _options.buttons.length; ++i) {
                _options.buttons[i].onClick = _onClick;
            }
            
            _log(htmlMessage);
            var options = {
                title: _options.title,
                message: htmlMessage,
                buttons: _options.buttons
            };
            _log(options);
            return options;
        }
    }

    /**
     * Creates an input dialog with the specified options.
     * @memberof InputDialog
     * @method create
     * 
     * @param {Object} [options] Configuration options for the input dialog.
     * @param {string} [options.title] The dialog title. Defaults to an empty string.
     * @param {string} [options.message] Text to be displayed about the input field. Defaults to an empty string.
     * @param {object[]} [options.buttons] A list of buttons to be included in the dialog. 
     *        Each item in the button list must be an object that contains a label and a value property.
              By default, a single button with the label OK and the value 1 is used.
     * @param {Object} [options.textarea] The configuration for the input text area. If not specified, default values as specified below are used.
     * @param {Object} [options.textarea.rows] The input text area's default height expressed in rows. Defaults to 5.
     * @param {Object} [options.textarea.cols] The input text area's default width expressed in columns. Defaults to 40. A value above 50 is NOT recommended.
     * @param {Object} [options.textarea.isMandatory] Indicates whether user input is mandatory. 
     *        If true and the user presses an action button without entering any input, an alert popup will be shown and the input dialog will stay open. Defaults to false.
     * @param {Object} [options.textarea.caption] The caption to show above the input text area. Defaults to 'Input field *' if isMandatory = true; omitted otherwise.
     * @param {Object} [options.textarea.initialValue] The initial value to be displayed in the input text area. Defaults to an empty string.
     * @param {Object} [options.textarea.fieldId] The ID of the field on the current page to which the user input should be written upon closing the Input dialog using any of the action buttons. 
     *        If specified, in addition to writing the text to this field, the text will still be passed to the success callback function if provided.
     * @param {int[]} [options.textarea.actionButtons] A list of buttons (value properties only) that will trigger validation and persisting the input. 
     *        Defaults to all buttons added to the input dialog. Using this option, the cancel button can be excluded as an action button, enabling it to
     *        be used to close an input dialog without providing input.
     * @param {function} [success] A callback function to be executed (asynchronously) when the dialog is closed. 
     *        It will be passed two parameters: (1) The value of the button pressed and (2) the input entered by the user.
     * @param {function} [failure] A callback function to be executed (asynchronously) if anything goes wrong. 
     *        It simply forward whatever NetSuite's native dialog.create() passes into the catch portion of the Promise object.
     */
    function create(options, success, failure) {
        doDialog(new InputDialog(options).build(), 'dialog')
        .then(function(result) {
            if (success) {
                success(result, window.nsiInputFieldValue)
            }
        })
        .catch(function(reason) {
            if (failure) {
                failure(reason)
            }
        });
    }

    return {
        create: create
    }
});
