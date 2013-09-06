/*=============================================================================
 *   Author:      Steve Greatrex - @stevegreatrex                               
 *                                                                              
 *   Description: Awesome extensions for KnockoutJs                              
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

		var

		//flag to indicate that the operation is running
		_isRunning = ko.observable(false),

		//flag to indicate that the operation failed when last executed
		_failed = ko.observable(),
		_failMessage = ko.observable(""),
		_completed = ko.observable(false),

		//record callbacks
		_callbacks = {
			done: [],
			fail: [function () { _failed(true); }],
			always: [function () { _isRunning(false); }]
		},

		//execute function (and return object
		_execute = function () {
			//check if we are able to execute
			if (!_canExecuteWrapper.call(options.context || this)) {
				//dont attach any global handlers
				return instantDeferred(false, null, options.context || this).promise();
			}

			//notify that we are running and clear any existing error message
			_isRunning(true);
			_failed(false);
			_failMessage("");

			//try to invoke the action and get a reference to the deferred object
			var promise;
			try {
				promise = options.action.apply(options.context || this, arguments);

				//if the returned result is *not* a promise, create a new one that is already resolved
				if (!promise || !promise.done || !promise.always || !promise.fail) {
					promise = instantDeferred(true, promise, options.context || this).promise();
				}

			} catch (error) {
				promise = instantDeferred(false, error, options.context || this).promise();
			}

			//set up our callbacks
			promise
				.always(_callbacks.always, function () { _completed(true); })
				.fail(_callbacks.fail)
				.done(_callbacks.done);

			return promise;
		},

		//canExecute flag
		_forceRefreshCanExecute = ko.observable(), //note, this is to allow us to force a re-evaluation of the computed _canExecute observable
		_canExecuteWrapper = options.canExecute || function () { return true; },
		_canExecute = ko.computed({
			deferEvaluation: true,
			read: function () {
				_forceRefreshCanExecute(); //just get the value so that we register _canExecute with _forceRefreshCanExecute
				return !_isRunning() && _canExecuteWrapper.call(options.context || this);
			}
		}, options.context || this),

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
			_callbacks.fail.push(function () {
				var result = callback.apply(this, arguments);
				if (result) {
					_failMessage(result);
				}
			});
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
		_execute.failMessage = _failMessage;
		_execute.always = _always;
		_execute.failed = _failed;
		_execute.completed = _completed;

		return _execute;
	};

	/**
	* Performs the following bindings on the valueAccessor command:
	* - loadingWhen: command.isRunning
	* - click: command
	* - enable: command.canExecute
	*/
	ko.bindingHandlers.command = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			var command = ko.utils.unwrapObservable(valueAccessor());
			ko.bindingHandlers.loadingWhen.init.call(this, element, command.isRunning, allBindingsAccessor);
			ko.bindingHandlers.click.init.call(this, element, ko.observable(command), allBindingsAccessor);
		},
		update: function (element, valueAccessor, allBindingsAccessor) {
			var command = ko.utils.unwrapObservable(valueAccessor());
			ko.bindingHandlers.loadingWhen.update.call(this, element, command.isRunning, allBindingsAccessor);
			ko.bindingHandlers.enable.update.call(this, element, command.canExecute, allBindingsAccessor);
		}
	};
    
	//factory method to create a $.Deferred that is already completed
	function instantDeferred(resolve, returnValue, context) {
		var deferred = $.Deferred();
		if (resolve) {
			deferred.resolveWith(context, [returnValue]);
		} else {
			deferred.rejectWith(context, [returnValue]);
		}

		return deferred;
	}
}(jQuery, ko));
;/*global ko:false*/

(function (ko) {
	"use strict";

	function toEditable(observable, getRollbackValue) {
		var rollbackValues = [],
			cancelledValue;

		getRollbackValue = getRollbackValue || function (observable) { return observable(); };

		//a flag to indicate if the field is being edited
		observable.isEditing = ko.observable(false);

		//start an edit
		observable.beginEdit = function () {
			if (observable.isEditing()) { return; }
			cancelledValue = undefined;

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

			cancelledValue = observable();

			observable(rollbackValues.pop());

			observable.isEditing(false);
		};

		//undo a set of cancelled changes
		observable.undoCancel = function () {
			if (cancelledValue === undefined) { return; }

			var value = cancelledValue; //grab value here as beginEdit will clear it
			observable.beginEdit();
			observable(value);
			cancelledValue = undefined;
		};

		//roll-back to historical committed values
		observable.rollback = function () {
			if (rollbackValues.length) {
				cancelledValue = undefined;
				observable(rollbackValues.pop());
			}
		};

		return observable;
	}

	ko.editable = function (initial) {
		return toEditable(ko.observable(initial));
	};

	ko.editableArray = function (initial) {
		return toEditable(ko.observableArray(initial || []), function (observable) {
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