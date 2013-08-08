/*=============================================================================
 *   Author:      Steve Greatrex - @stevegreatrex                               
 *                                                                              
 *   Description: Helper extensions for KnockoutJs                              
 *=============================================================================*/

(function (window, undefined) {
    "use strict";
    (function (factory) {
        if (typeof define === "function" && define.amd) { // AMD
            define("ko.plus", ["jquery", "knockout"], factory);
        }
        else {
            factory(window.jQuery, window.ko);
        }
    }(function ($, ko) {;/*global jQuery:false, ko:false*/

(function ($, ko) {
    "use strict";
    /**
    * Creates a new instance of ko.command
    *
    * @constructor
    * @param  options The options object for the command or a commmand function
    * @return A new instance of ko.command
    */
    ko.command = function (options) {
        //allow just a function to be passed in
        if (typeof options === "function") { options = { action: options }; }

        //check an action was specified
        if (!options) { throw "No options were specified"; }
        if (!options.action) { throw "No action was specified in the options"; }

        var _promise,

        //flag to indicate that the operation is running
        _isRunning = ko.observable(false),

        //flag to indicate that the operation failed when last executed
        _failed = ko.observable(false),

        //record callbacks
        _callbacks = {
            done: [],
            fail: [function () { _failed(true); }],
            always: [function () { _isRunning(false); _promise = null; }]
        },

        //abort the pending operation
        _abortIfNecessary = function () {
            if (_promise &&
                _promise.abort &&
                options.concurrentExecution === "abortPendingRequest") {

                _promise.abort();
            }
        },

        //execute function (and return object)
        _execute = function () {
            _abortIfNecessary();

            //check if we are able to execute
            if (!_canExecute()) {
                //dont attach any global handlers
                return instantDeferred(false).promise();
            }

            //notify that we are running and clear any existing error message
            _isRunning(true);
            _failed(false);

            //try to invoke the action and get a reference to the deferred object
            var promise;
            try {
                promise = options.action.apply(_execute, arguments);

                //if the returned result is *not* a promise, create a new one that is already resolved
                if (!promise || !promise.done || !promise.always || !promise.fail) {
                    promise = instantDeferred(true, promise).promise();
                }

            } catch (error) {
                promise = instantDeferred(false, error).promise();
            }

            //set up our callbacks
            promise
                .always(_callbacks.always)
                .fail(_callbacks.fail)
                .done(_callbacks.done);

            _promise = promise;

            return _promise;
        },

        //canExecute flag
        _forceRefreshCanExecute = ko.observable(), //note, this is to allow us to force a re-evaluation of the computed _canExecute observable
        _canExecute = ko.computed(function () {
            _forceRefreshCanExecute(); //just get the value so that we register _canExecute with _forceRefreshCanExecute
            return (!_isRunning() || options.concurrentExecution === "abortPendingRequest") &&
                (typeof options.canExecute === "undefined" || options.canExecute.call(_execute));
        }, _execute),

        //invalidate canExecute
        _canExecuteHasMutated = function () {
            _forceRefreshCanExecute.notifySubscribers();
        },

        //function used to append done callbacks
        _done = function (callback) {
            _callbacks.done.push(callback);
            return _execute;
        },
        //function used to append failure callbacks
        _fail = function (callback) {
            _callbacks.fail.push(callback);
            return _execute;
        },
        //function used to append always callbacks
        _always = function (callback) {
            _callbacks.always.push(callback);
            return _execute;
        };

        //attach the done and fail handlers on the options if specified
        if (options.done) { _callbacks.done.push(options.done); }
        if (options.fail) { _callbacks.fail.push(options.fail); }

        //public properties
        _execute.isRunning = _isRunning;
        _execute.canExecute = _canExecute;
        _execute.canExecuteHasMutated = _canExecuteHasMutated;
        _execute.done = _done;
        _execute.fail = _fail;
        _execute.always = _always;
        _execute.failed = _failed;

        return _execute;
    };

    //factory method to create a $.Deferred that is already completed
    function instantDeferred(resolve, returnValue) {
        var deferred = $.Deferred();
        if (resolve) {
            deferred.resolve(returnValue);
        } else {
            deferred.reject(returnValue);
        }

        return deferred;
    }
}(jQuery, ko));
;/*global ko:false*/

(function (ko) {
    "use strict";

    function toEditable(observable, getRollbackValue) {
        var rollbackValues = [];

        getRollbackValue = getRollbackValue || function (observable) { return observable(); };

        //a flag to indicate if the field is being edited
        observable.isEditing = ko.observable(false);

        //start an edit
        observable.beginEdit = function () {
            if (observable.isEditing()) { return; }

            rollbackValues.push(getRollbackValue(observable));

            observable.isEditing(true);
        };

        //end (commit) an edit
        observable.endEdit = function () {
            if (!observable.isEditing()) { return; }

            observable.isEditing(false);
        };

        //cancel and roll-back an edit
        observable.cancelEdit = function () {
            if (!observable.isEditing() || !rollbackValues.length) { return; }

            observable(rollbackValues.pop());

            observable.isEditing(false);
        };

        //roll-back to historical committed values
        observable.rollback = function () {
            if (rollbackValues.length) {
                observable(rollbackValues.pop());
            }
        };

        return observable;
    }

    ko.editable = function (initial) {
        return toEditable(ko.observable(initial));
    };

    ko.editableArray = function (initial) {
        return toEditable(ko.observableArray(initial), function (observable) {
            return observable.slice();
        });
    };

    var forEachEditableProperty = function (target, action) {
        for (var prop in target) {
            if (target.hasOwnProperty(prop)) {
                var value = target[prop];

                //direct editables
                if (value && value.isEditing) {
                    action(value);
                }

                var unwrappedValue = ko.utils.unwrapObservable(value);

                //editables in arrays
                if (unwrappedValue && unwrappedValue.length) {
                    for (var i = 0; i < unwrappedValue.length; i++) {
                        if (unwrappedValue[i] && unwrappedValue[i].isEditing) {
                            action(unwrappedValue[i]);
                        }
                    }
                }
            }
        }
    };

    ko.editable.makeEditable = function (target) {
        if (!target) {
            throw "Target must be specified";
        }

        target.isEditing = ko.observable(false);

        target.beginEdit = function () {
            if (!target.isEditable || target.isEditable()) {
                forEachEditableProperty(target, function (prop) { prop.beginEdit(); });
                target.isEditing(true);
            }
        };

        target.endEdit = function () {
            forEachEditableProperty(target, function (prop) { prop.endEdit(); });
            target.isEditing(false);
        };

        target.cancelEdit = function () {
            forEachEditableProperty(target, function (prop) { prop.cancelEdit(); });
            target.isEditing(false);
        };

        target.rollback = function () {
            forEachEditableProperty(target, function (prop) { prop.rollback(); });
        };
    };
}(ko));;/*global jQuery:false, ko:false*/

(function ($, ko) {
    "use strict";
    /**
	* loadingWhen replaces the content of a container with a loading spinner
	* when the bound value is truthy.
	* Styling requires the .loader class to be defined for the page as well as the loaderClass property 
	* (or a default of .loader-dark)
	*/
    ko.bindingHandlers.loadingWhen = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            var loaderClass = ko.utils.unwrapObservable(allBindingsAccessor()).loaderClass || "loader-white",
				$element = $(element),
				currentPosition = $element.css("position"),
				$loader = $("<div>", { "class": loaderClass }).addClass("loader").hide();

            //add the loader
            $element.append($loader);

            //make sure that we can absolutely position the loader against the original element
            if (currentPosition === "auto" || currentPosition === "static") {
                $element.css("position", "relative");
            }

            //center the loader
            $loader.css({
                position: "absolute",
                top: "50%",
                left: "50%",
                "margin-left": -($loader.width() / 2) + "px",
                "margin-top": -($loader.height() / 2) + "px"
            });
        },
        update: function (element, valueAccessor) {
            var isLoading = ko.utils.unwrapObservable(valueAccessor()),
				$element = $(element),
				$childrenToHide = $element.children(":not(div.loader)"),
				$loader = $element.find("div.loader");

            if (isLoading) {
                $childrenToHide.css("visibility", "hidden").attr("disabled", "disabled");
                $loader.show();
            }
            else {
                $loader.fadeOut("fast");
                $childrenToHide.css("visibility", "visible").removeAttr("disabled");
            }
        }
    };
}(jQuery, ko));;}));
}(window));