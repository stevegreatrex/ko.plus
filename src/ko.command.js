/*global define:false*/
(function (window, undefined) {
"use strict";
(function (factory) {
	if (typeof define === "function" && define.amd) { // AMD
		define("ko.command", ["jquery", "knockout"], factory);
	}
	else {
		window.ko.command = factory(window.$, window.ko);
	}
}(function ($, ko) {

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
}));
}(window));