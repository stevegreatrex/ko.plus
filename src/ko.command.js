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
	if (typeof options === 'function') { options = { action: options }; }

	//check an action was specified
	if (!options) { throw 'No options were specified'; }
	if (!options.action) { throw 'No action was specified in the options'; }

	var isRunning = ko.observable(false);

	//flag to indicate that the operation failed when last executed
	var failed = ko.observable();
	var failMessage = ko.observable('');
	var completed = ko.observable(false);

	//record callbacks
	var callbacks = {
		done: [],
		fail: [function () { failed(true); }],
		always: [
			function () { isRunning(false); },
			function() { completed(true); }
		]
	};

	var reset = function () {
		isRunning(false);
		failed(false);
		failMessage('');
	};

	//execute function (and return object
	var execute = function () {
		//check if we are able to execute
		if (!canExecuteWrapper.call(options.context || this)) {
			//dont attach any global handlers
			return instantDeferred(false, null, options.context || this).promise();
		}

		//notify that we are running and clear any existing error message
		isRunning(true);
		failed(false);
		failMessage('');

		//try to invoke the action and get a reference to the deferred object
		var promise;
		try {
			promise = options.action.apply(options.context || this, arguments);

			//if the returned result is *not* a promise, create a new one that is already resolved
			if (!isPromise(promise)) {
				promise = instantDeferred(true, promise, options.context || this).promise();
			}

		} catch (error) {
			promise = instantDeferred(false, error, options.context || this).promise();
		}

		//set up our callbacks
		callbacks.always.forEach(function(callback) {
			promise.then(callback, callback);
		});
		callbacks.fail.forEach(function(callback) {
			promise.then(null, callback);
		});
		callbacks.done.forEach(function(callback) {
			promise.then(callback);
		});

		return promise;
	};

	//canExecute flag
	var forceRefreshCanExecute = ko.observable(); //note, this is to allow us to force a re-evaluation of the computed canExecute observable
	var canExecuteWrapper = options.canExecute || function () { return true; };
	var canExecute = ko.computed({
		deferEvaluation: true,
		read: function () {
			forceRefreshCanExecute(); //just get the value so that we register canExecute with forceRefreshCanExecute
			return !isRunning() && canExecuteWrapper.call(options.context || this);
		}
	}, options.context || this);

	//invalidate canExecute
	var canExecuteHasMutated = function () {
		forceRefreshCanExecute.notifySubscribers();
	};

	//function used to append done callbacks
	var done = function (callback) {
		callbacks.done.push(callback);
		return execute;
	};

	//function used to append failure callbacks
	var fail = function (callback) {
		callbacks.fail.push(function () {
			var result = callback.apply(this, arguments);
			if (result) {
				failMessage(result);
			}
		});
		return execute;
	};

	//function used to append always callbacks
	var always = function (callback) {
		callbacks.always.push(callback);
		return execute;
	};

	var then = function(resolve, reject) {
		if (resolve) { callbacks.done.push(resolve); }
		if (reject) { callbacks.fail.push(reject); }

		return execute;
	};

	//attach the done and fail handlers on the options if specified
	if (options.done) { callbacks.done.push(options.done); }
	if (options.fail) { callbacks.fail.push(options.fail); }

	//public properties
	execute.isRunning = isRunning;
	execute.canExecute = canExecute;
	execute.canExecuteHasMutated = canExecuteHasMutated;
	execute.done = done;
	execute.fail = fail;
	execute.then = then;
	execute.failMessage = failMessage;
	execute.always = always;
	execute.failed = failed;
	execute.completed = completed;
	execute.reset = reset;

	return execute;
};

/**
 * Performs the following bindings on the valueAccessor command:
 * - loadingWhen: command.isRunning
 * - click: command
 * - enable: command.canExecute
 */
ko.bindingHandlers.command = {
	init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		var command = ko.unwrap(valueAccessor());
		ko.bindingHandlers.loadingWhen.init.call(this, element, command.isRunning, allBindingsAccessor);
		ko.bindingHandlers.click.init.call(this, element, ko.observable(command), allBindingsAccessor, viewModel, bindingContext);
	},
	update: function (element, valueAccessor, allBindingsAccessor) {
		var command = ko.unwrap(valueAccessor());
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

function isPromise(promise) {
	return promise && promise.then;
}
