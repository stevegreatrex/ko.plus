/*global ko: false, jQuery: false, module: false, test: false, raises: false, equal: false, ok: false*/


define(['qunit'], function(QUnit) {
	'use strict';

	QUnit.module('ko.command Tests');

	QUnit.test('throws when null options are specified', function (assert) {
		assert.raises(function () {
			ko.command();
		}, /No options were specified/);
	});

	QUnit.test('throws when no action is specified', function (assert) {
		assert.raises(function () {
			ko.command({});
		}, /No action was specified in the options/);
	});

	QUnit.test('isRunning initially false', function (assert) {
		var command = ko.command({ action: {} });
		assert.equal(false, command.isRunning());
	});

	QUnit.test('execute returns a completed deferred if the action does not return a promise', function (assert) {
		var command = ko.command({
			action: function () { }
		});

		//execute the command
		var result = command();

		//check that the returned item is a completed promise
		assert.ok(result, 'The result should be a completed promise');
		assert.ok(result.done, 'The result should be a completed promise');
		assert.ok(result.fail, 'The result should be a completed promise');
		assert.ok(result.always, 'The result should be a completed promise');

		//check that we are no longer running
		assert.equal(command.isRunning(), false, 'The command should not be running');
	});

	QUnit.test('execute resolves completed deferred with original result if result is returned from function', function (assert) {
		var doneCalled = false,
			actionResult = { value: 123 },
			command = ko.command({
				action: function () { return actionResult; }
			});

		//execute the command and check the result
		command().done(function (result) {
			assert.equal(result, actionResult, 'The actions result should be passed to the done handler');
			doneCalled = true;
		});

		//check that the handler was actually called
		assert.ok(doneCalled, 'The done handler should have been invoked immediately');

		//check that we are no longer running
		assert.equal(command.isRunning(), false, 'The command should not be running');
	});


	QUnit.test('execute runs fail handlers if the command action throws an error', function (assert) {
		var failCalled = false,
			actionError = 'a random error',
			command = ko.command({
				action: function () { throw actionError; }
			});

		//execute the command and check the result
		command().fail(function (error) {
			assert.equal(error, actionError, 'The actions error should be passed to the fail handler');
			failCalled = true;
		});

		//check that the handler was actually called
		assert.ok(failCalled, 'The fail handler should have been invoked immediately');

		//check that we are no longer running
		assert.equal(command.isRunning(), false, 'The command should not be running');
	});

	QUnit.test('execute is passed correct this and arguments', function (assert) {
		var arg1 = 'one', arg2 = 'two';
		var outsideContext = this;
		var command = ko.command({
			action: function (a1, a2) {
				assert.equal(this, outsideContext, 'this should be set to the context in which the command is invoked');
				assert.equal(a1, arg1, 'arguments were not passed in');
				assert.equal(a2, arg2, 'arguments were not passed in');
				return $.Deferred();
			},
			context: this
		});

		command(arg1, arg2);
	});


	QUnit.test('execute sets isRunning', function (assert) {
		var deferred = $.Deferred();
		var command = ko.command({
			action: function () {
				return deferred;
			}
		});

		//execute the command
		command();

		//check that isRunning is true and the error was cleared
		assert.equal(true, command.isRunning(), 'isRunning should be set');

		//complete the async operation
		deferred.resolve();

		//check is running has been reset
		assert.equal(false, command.isRunning(), 'isRunning should be reset');
	});

	QUnit.test('execute invokes done handlers', function (assert) {
		var deferred = $.Deferred(),
			responseData = {},
			handlerCalled = false;

		var command = ko.command({
			action: function () {
				return deferred;
			},
			done: function (data) {
				assert.equal(responseData, data, 'The data should be passed to the done handler');
				handlerCalled = true;
			}
		});

		//execute the command
		command();

		//complete the async operation
		deferred.resolve(responseData);

		//check the handler was invoked
		assert.equal(true, handlerCalled, 'The done handler should have been called');
	});

	QUnit.test('execute invokes fail handlers', function (assert) {
		var deferred = $.Deferred(),
			responseData = {},
			handlerCalled = false;

		var command = ko.command({
			action: function () {
				return deferred;
			},
			fail: function (data) {
				assert.equal(responseData, data, 'The data should be passed to the fail handler');
				handlerCalled = true;
			}
		});

		//execute the command
		command();

		//complete the async operation
		deferred.reject(responseData);

		//check the handler was invoked
		assert.equal(true, handlerCalled, 'The fail handler should have been called');
	});

	QUnit.test('done attaches handler', function (assert) {
		var deferred = $.Deferred(),
			responseData = {},
			handlerCalled = false;

		var command = ko.command({
			action: function () {
				return deferred;
			}
		})
			.done(function (data) {
				assert.equal(responseData, data, 'The data should be passed to the done handler');
				handlerCalled = true;
			});

		//execute the command
		command();

		//complete the async operation
		deferred.resolve(responseData);

		//check the handler was invoked
		assert.equal(true, handlerCalled, 'The done handler should have been called');
	});

	QUnit.test('fail attaches handler', function (assert) {
		var deferred = $.Deferred(),
			responseData = {},
			handlerCalled = false;

		var command = ko.command({
			action: function () {
				return deferred;
			}
		})
			.fail(function (data) {
				assert.equal(responseData, data, 'The data should be passed to the fail handler');
				handlerCalled = true;
			});

		//execute the command
		command();

		//complete the async operation
		deferred.reject(responseData);

		//check the handler was invoked
		assert.equal(true, handlerCalled, 'The fail handler should have been called');
	});

	QUnit.test('always handler is invoked on done', function (assert) {
		var deferred = $.Deferred(),
			responseData = {},
			handlerCalled = false;

		var command = ko.command({
			action: function () {
				return deferred;
			}
		})
			.always(function (data) {
				assert.equal(responseData, data, 'The data should be passed to the done handler');
				handlerCalled = true;
			});

		//execute the command
		command();

		//complete the async operation
		deferred.resolve(responseData);

		//check the handler was invoked
		assert.equal(true, handlerCalled, 'The done handler should have been called');
	});

	QUnit.test('always handler is invoked on fail', function (assert) {
		var deferred = $.Deferred(),
			responseData = {},
			handlerCalled = false;

		var command = ko.command({
			action: function () {
				return deferred;
			}
		})
			.always(function (data) {
				assert.equal(responseData, data, 'The data should be passed to the fail handler');
				handlerCalled = true;
			});

		//execute the command
		command();

		//complete the async operation
		deferred.reject(responseData);

		//check the handler was invoked
		assert.equal(true, handlerCalled, 'The fail handler should have been called');
	});

	QUnit.test('can specify function as only parameter', function (assert) {
		var deferred = $.Deferred();

		var command = ko.command(function () {
			return deferred;
		});

		//execute the command
		command();

		//check that isRunning is true
		assert.equal(true, command.isRunning(), 'isRunning should be set');

		//complete the async operation
		deferred.resolve();

		//check is running has been reset
		assert.equal(false, command.isRunning(), 'isRunning should be reset');
	});

	QUnit.test('execute returns promise', function (assert) {
		var deferred = $.Deferred(),
			responseData = {},
			handlerCalled = false;

		var command = ko.command({
			action: function () {
				return deferred;
			}
		});

		//execute the command and attach the done handler
		command().done(function (data) {
			assert.equal(responseData, data, 'The data should be passed to the done handler');
			handlerCalled = true;
		});

		//complete the async operation
		deferred.resolve(responseData);

		//check the handler was invoked
		assert.equal(true, handlerCalled, 'The done handler should have been called');
	});

	QUnit.test('can use ko.command syntax', function (assert) {
		var deferred1 = $.Deferred(),
			deferred2 = $.Deferred(),
			done1 = false,
			done2 = false,
			ViewModel = function () {
				this.command1 = ko.command(function () { return deferred1; }).done(function () { done1 = true; });
				this.command2 = ko.command(function () { return deferred2; }).done(function () { done2 = true; });
			},
			testSubject = new ViewModel();

		//run one of the commands and check it is the only one running
		testSubject.command1();
		assert.equal(testSubject.command1.isRunning(), true, 'First command should be running');
		assert.equal(testSubject.command2.isRunning(), false, 'Second command should not be running');

		//start the second command running
		testSubject.command2();
		assert.equal(testSubject.command1.isRunning(), true, 'Both commands should now be running');
		assert.equal(testSubject.command2.isRunning(), true, 'Both commands should now be running');

		//allow the second command to complete
		deferred2.resolve();

		//check that only the second command has completed
		assert.equal(testSubject.command1.isRunning(), true, 'First command should still be running');
		assert.equal(testSubject.command2.isRunning(), false, 'Second command should have completed');
		assert.equal(done1, false, 'First command should not have invoked handlers');
		assert.equal(done2, true, 'Second command should have invoked handlers');

		//now let the first command complete and check it's properties
		deferred1.resolve();
		assert.equal(testSubject.command1.isRunning(), false, 'First command should now have completed');
		assert.equal(done1, true, 'First command should have invoked handlers');
	});

	QUnit.test('canExecute returns true by default', function (assert) {
		var command = ko.command(function () { });

		assert.ok(command.canExecute(), 'canExecute should return true unless something has been specified');
	});

	QUnit.test('canExecute returns false whilst action is running', function (assert) {
		var deferred = $.Deferred(),
			command = ko.command(function () { return deferred; });

		//execute the command
		command();

		//check that canExecute is false
		assert.ok(!command.canExecute(), 'canExecute should return false when the command is running');

		//allow the command to complete
		deferred.resolve();

		//check that the command can execute again
		assert.ok(command.canExecute(), 'canExecute should return true once the command completes');
	});

	QUnit.test('canExecute returns true after action fails', function (assert) {
		var deferred = $.Deferred(),
			command = ko.command(function () { return deferred; });

		//execute the command
		command();

		//check that canExecute is false
		assert.ok(!command.canExecute(), 'canExecute should return false when the command is running');

		//allow the command to fail
		deferred.reject();

		//check that the command can execute again
		assert.ok(command.canExecute(), 'canExecute should return true once the command fails');
	});

	QUnit.test('canExecute returns false if options-specified item returns false', function (assert) {
		var actionCanExecute = true,
			command = ko.command({
				action: function () { return null; },
				canExecute: function () { return actionCanExecute; }
			});

		//check initially can execute
		assert.ok(command.canExecute(), 'canExecute should return true when not running and when parameter canExecute is true');

		//now set the action's canExecute to false and check we can't execute
		actionCanExecute = false;
		command.canExecuteHasMutated();
		assert.ok(!command.canExecute(), 'canExecute should return false when the parameter canExecute is false');

		//fake a start to the execution and check that canExecute is still false
		command.isRunning(true);
		assert.ok(!command.canExecute(), 'canExecute should return false when the command is running');

		//now set the parameter canExecute to true and check canExecute is still false (we are still running)
		actionCanExecute = true;
		command.canExecuteHasMutated();
		assert.ok(!command.canExecute(), 'canExecute should return false when the command is running');

		//fake an end to the running
		command.isRunning(false);

		//check that the command can execute again
		assert.ok(command.canExecute(), 'canExecute should return true once the command stops running and the parameter-specified canExecute returns true');
	});

	QUnit.test('canExecute is called in the context of the command', function (assert) {
		var canExecuteContext,
			outsideContext = this,
			command = ko.command({
				action: function () { },
				canExecute: function () {
					canExecuteContext = this;
				},
				context: this
			});

		command.canExecute();

		assert.equal(canExecuteContext, outsideContext, 'canExecute should be called in the context in which the command was executed');
	});

	QUnit.test('execute returns a completed deferred object when canExecute is false', function (assert) {
		var actionCalled = false,
			doneCalled = false,
			failCalled = false,
			command = ko.command({
				action: function () { actionCalled = true; },
				canExecute: function () { return false; }
			});

		//try to invoke the command
		command()
			.done(function () { doneCalled = true; })
			.fail(function () { failCalled = true; });

		//check that neither the done handler nor the action were called
		assert.ok(!doneCalled, 'The done handler should have been called');
		assert.ok(failCalled, 'The fail handler should have been called');
		assert.ok(!command.isRunning(), 'The command should not be running');
		assert.ok(!actionCalled, 'The action should not have been invoked');
	});

	QUnit.test('failed is initially undefined', function (assert) {
		var testSubject = ko.command(function () { });

		assert.equal(testSubject.failed(), undefined, 'failed should initially return undefined');
	});

	QUnit.test('failed is set to true when operation fails', function (assert) {
		var deferred = $.Deferred(),
			responseData = {};

		var command = ko.command({
			action: function () {
				return deferred;
			}
		});

		//fake the error handler being true
		command.failed(true);

		//execute the command
		command();

		//check that failed has been reset
		assert.equal(command.failed(), false, 'failed should have been reset');

		//complete the async operation
		deferred.reject(responseData);

		//check the flag was set
		assert.equal(command.failed(), true, 'failed should have been set');
	});

	QUnit.test('all success functions are run in correct context', function (assert) {
		var counts = {};

		//helper to create stub functions that check the context and update a count
		function createStubFunction(name) {
			counts[name] = 0;
			return function () {
				assert.equal(this.id, 123, 'The context of the ' + name + ' function should be the view model');
				counts[name]++;
				return true; //only needed for canExecute but doesn't cause problems elsewhere
			};
		}

		//the viewmodel itself
		function ViewModel() {
			this.id = 123;

			this.action = ko.command({
				action: this.execute,
				canExecute: this.canExecute
			})
				.done(this.done)
				.always(this.always);
		}

		//stub functions on the prototype
		ViewModel.prototype.execute = createStubFunction('execute');
		ViewModel.prototype.canExecute = createStubFunction('canExecute');
		ViewModel.prototype.done = createStubFunction('done');
		ViewModel.prototype.always = createStubFunction('always');

		var instance = new ViewModel();
		instance.action();

		assert.equal(counts.execute, 1, 'execute should have been called');
		assert.equal(counts.done, 1, 'done should have been called');
		assert.equal(counts.always, 1, 'always should have been called');
		assert.equal(counts.canExecute, 1, 'canExecute should have been called');
	});

	QUnit.test('fail function is run in correct context', function (assert) {
		var counts = {};

		function createStubFunction(name) {
			counts[name] = 0;
			return function () {
				assert.equal(this.id, 123, 'The context of the ' + name + ' function should be the view model');
				counts[name]++;
			};
		}

		function ViewModel() {
			this.id = 123;

			this.action = ko.command(function () {
				throw 'Error';
			})
				.fail(this.fail)
				.always(this.always);
		}

		ViewModel.prototype.always = createStubFunction('always');
		ViewModel.prototype.fail = createStubFunction('fail');

		var instance = new ViewModel();
		instance.action();

		assert.equal(counts.fail, 1, 'fail should have been called');
		assert.equal(counts.always, 1, 'always should have been called');
	});

	QUnit.test('failMessage is initially empty', function (assert) {
		var command = ko.command(function() {});
		assert.equal(command.failMessage(), '', 'failMessage should be blank');
	});

	QUnit.test('sets failMessage to the value returned from the fail handler', function (assert) {
		var deferred = $.Deferred();

		var command = ko.command(function () {
			return deferred;
		})
			.fail(function() { }) //handler with no return value - to be ignored
			.fail(function () { return 'new error'; })
			.fail(function () { }); //handler with no return value - to be ignored

		//fake the error handler being set
		command.failMessage('error!');

		//execute the command
		command();

		//check that failMessage has been reset
		assert.equal(command.failMessage(), '', 'failMessage should have been reset');

		//complete the async operation
		deferred.reject();

		//check the flag was set
		assert.equal(command.failMessage(), 'new error', 'failMessage should have been set');
	});

	QUnit.test('completed is set after command finishes', function (assert) {
		function checkCompletedBehaviour(makeComplete) {
			var deferred = $.Deferred();

			var command = ko.command(function () {
				return deferred;
			});

			assert.equal(command.completed(), false, 'completed should be false initially');

			command();
			assert.equal(command.completed(), false, 'completed should be false until the command has finished');

			makeComplete(deferred);
			assert.equal(command.completed(), true, 'completed should be true once the command has finished');
		}

		checkCompletedBehaviour(function (deferred) { deferred.resolve(); });
		checkCompletedBehaviour(function (deferred) { deferred.reject(); });
	});

	QUnit.test('then can be used in place of done', function (assert) {
		var deferred = $.Deferred(),
			responseData = {},
			handlerCalled = false;

		var command = ko.command({
			action: function () {
				return deferred;
			}
		})
			.then(function (data) {
				assert.equal(responseData, data, 'The data should be passed to the handler');
				handlerCalled = true;
			});

		//execute the command
		command();

		//complete the async operation
		deferred.resolve(responseData);

		//check the handler was invoked
		assert.equal(true, handlerCalled, 'The fail handler should have been called');
	});

	QUnit.test('then can be used in place of fail', function (assert) {
		var deferred = $.Deferred(),
			responseData = {},
			handlerCalled = false;

		var command = ko.command({
			action: function () {
				return deferred;
			}
		})
			.then(null, function (data) {
				assert.equal(responseData, data, 'The data should be passed to the fail handler');
				handlerCalled = true;
			});

		//execute the command
		command();

		//complete the async operation
		deferred.reject(responseData);

		//check the handler was invoked
		assert.equal(true, handlerCalled, 'The fail handler should have been called');
	});

	QUnit.test('any thenable is treated as a promise', function (assert) {
		var thenInvoked = false;
		var thenable = {
			then: function() {
				thenInvoked = true;
				return $.when();
			}
		};

		var command = ko.command(function() {
			return thenable;
		});

		command();

		assert.ok(thenInvoked, 'The then function should have been invoked');
	});

	QUnit.test('reset returns status flags to original value', function (assert) {
		var command = ko.command({
			action: function () {
				throw 'test error';
			}
		})
		.fail(function () {
			return 'this is a test';
		});

		// pre-checks
		assert.equal(false, command.isRunning());

		//execute the command
		var result = command();

		// post-checks
		assert.equal(false, command.isRunning());
		assert.equal(true, command.failed());
		assert.equal('this is a test', command.failMessage());

		// reset
		command.reset();

		// checks after reset
		assert.equal(false, command.isRunning());
		assert.equal(false, command.failed());
		assert.equal('', command.failMessage());
	});

});