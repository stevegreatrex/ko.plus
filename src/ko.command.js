/*global jQuery:false, ko:false*/

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
	init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		var command = ko.utils.unwrapObservable(valueAccessor());
		ko.bindingHandlers.loadingWhen.init.call(this, element, command.isRunning, allBindingsAccessor);
		ko.bindingHandlers.click.init.call(this, element, ko.observable(command), allBindingsAccessor, viewModel, bindingContext);
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
