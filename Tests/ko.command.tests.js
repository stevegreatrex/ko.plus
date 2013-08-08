/*global require: false, module: false, test: false, raises: false, equal: false, ok: false*/


require([
    "jquery",
    "knockout",
    "ko.command"],

function ($, ko) {
    "use strict";

    module("ko.command Tests");

    test("throws when null options are specified", function () {
        raises(function () {
            ko.command();
        }, /No options were specified/);
    });

    test("throws when no action is specified", function () {
        raises(function () {
            ko.command({});
        }, /No action was specified in the options/);
    });

    test("isRunning initially false", function () {
        var command = ko.command({ action: {} });
        equal(false, command.isRunning());
    });

    test("execute returns a completed deferred if the action does not return a promise", function () {
        var command = ko.command({
            action: function () { }
        });

        //execute the command
        var result = command();

        //check that the returned item is a completed promise
        ok(result, "The result should be a completed promise");
        ok(result.done, "The result should be a completed promise");
        ok(result.fail, "The result should be a completed promise");
        ok(result.always, "The result should be a completed promise");
        equal(result.state(), "resolved", "The result should be a completed promise");

        //check that we are no longer running
        equal(command.isRunning(), false, "The command should not be running");
    });

    test("execute resolves completed deferred with original result if result is returned from function", function () {
        var doneCalled = false,
            actionResult = { value: 123 },
            command = ko.command({
                action: function () { return actionResult; }
            });

        //execute the command and check the result
        command().done(function (result) {
            equal(result, actionResult, "The action's result should be passed to the done handler");
            doneCalled = true;
        });

        //check that the handler was actually called
        ok(doneCalled, "The done handler should have been invoked immediately");

        //check that we are no longer running
        equal(command.isRunning(), false, "The command should not be running");
    });


    test("execute runs fail handlers if the command action throws an error", function () {
        var failCalled = false,
            actionError = "a random error",
            command = ko.command({
                action: function () { throw actionError; }
            });

        //execute the command and check the result
        command().fail(function (error) {
            equal(error, actionError, "The action's error should be passed to the fail handler");
            failCalled = true;
        });

        //check that the handler was actually called
        ok(failCalled, "The fail handler should have been invoked immediately");

        //check that we are no longer running
        equal(command.isRunning(), false, "The command should not be running");
    });

    test("execute is passed correct this and arguments", function () {
        var arg1 = "one", arg2 = "two";
        var command = ko.command({
            action: function (a1, a2) {
                equal(this, command, "this was not set to the command");
                equal(a1, arg1, "arguments were not passed in");
                equal(a2, arg2, "arguments were not passed in");
                return $.Deferred();
            }
        });

        command(arg1, arg2);
    });


    test("execute sets isRunning", function () {
        var deferred = $.Deferred();
        var command = ko.command({
            action: function () {
                return deferred;
            }
        });

        //execute the command
        command();

        //check that isRunning is true and the error was cleared
        equal(true, command.isRunning(), "isRunning should be set");

        //complete the async operation
        deferred.resolve();

        //check is running has been reset
        equal(false, command.isRunning(), "isRunning should be reset");
    });

    test("execute invokes done handlers", function () {
        var deferred = $.Deferred(),
            responseData = {},
            handlerCalled = false;

        var command = ko.command({
            action: function () {
                return deferred;
            },
            done: function (data) {
                equal(responseData, data, "The data should be passed to the done handler");
                handlerCalled = true;
            }
        });

        //execute the command
        command();

        //complete the async operation
        deferred.resolve(responseData);

        //check the handler was invoked
        equal(true, handlerCalled, "The done handler should have been called");
    });

    test("execute invokes fail handlers", function () {
        var deferred = $.Deferred(),
            responseData = {},
            handlerCalled = false;

        var command = ko.command({
            action: function () {
                return deferred;
            },
            fail: function (data) {
                equal(responseData, data, "The data should be passed to the fail handler");
                handlerCalled = true;
            }
        });

        //execute the command
        command();

        //complete the async operation
        deferred.reject(responseData);

        //check the handler was invoked
        equal(true, handlerCalled, "The fail handler should have been called");
    });

    test("done attaches handler", function () {
        var deferred = $.Deferred(),
            responseData = {},
            handlerCalled = false;

        var command = ko.command({
            action: function () {
                return deferred;
            }
        })
        .done(function (data) {
            equal(responseData, data, "The data should be passed to the done handler");
            handlerCalled = true;
        });

        //execute the command
        command();

        //complete the async operation
        deferred.resolve(responseData);

        //check the handler was invoked
        equal(true, handlerCalled, "The done handler should have been called");
    });

    test("fail attaches handler", function () {
        var deferred = $.Deferred(),
            responseData = {},
            handlerCalled = false;

        var command = ko.command({
            action: function () {
                return deferred;
            }
        })
        .fail(function (data) {
            equal(responseData, data, "The data should be passed to the fail handler");
            handlerCalled = true;
        });

        //execute the command
        command();

        //complete the async operation
        deferred.reject(responseData);

        //check the handler was invoked
        equal(true, handlerCalled, "The fail handler should have been called");
    });

    test("always handler is invoked on done", function () {
        var deferred = $.Deferred(),
            responseData = {},
            handlerCalled = false;

        var command = ko.command({
            action: function () {
                return deferred;
            }
        })
        .always(function (data) {
            equal(responseData, data, "The data should be passed to the done handler");
            handlerCalled = true;
        });

        //execute the command
        command();

        //complete the async operation
        deferred.resolve(responseData);

        //check the handler was invoked
        equal(true, handlerCalled, "The done handler should have been called");
    });

    test("always handler is invoked on fail", function () {
        var deferred = $.Deferred(),
            responseData = {},
            handlerCalled = false;

        var command = ko.command({
            action: function () {
                return deferred;
            }
        })
        .always(function (data) {
            equal(responseData, data, "The data should be passed to the fail handler");
            handlerCalled = true;
        });

        //execute the command
        command();

        //complete the async operation
        deferred.reject(responseData);

        //check the handler was invoked
        equal(true, handlerCalled, "The fail handler should have been called");
    });

    test("can specify function as only parameter", function () {
        var deferred = $.Deferred();

        var command = ko.command(function () {
            return deferred;
        });

        //execute the command
        command();

        //check that isRunning is true
        equal(true, command.isRunning(), "isRunning should be set");

        //complete the async operation
        deferred.resolve();

        //check is running has been reset
        equal(false, command.isRunning(), "isRunning should be reset");
    });

    test("execute returns promise", function () {
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
            equal(responseData, data, "The data should be passed to the done handler");
            handlerCalled = true;
        });

        //complete the async operation
        deferred.resolve(responseData);

        //check the handler was invoked
        equal(true, handlerCalled, "The done handler should have been called");
    });

    test("can use ko.command syntax", function () {
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
        equal(testSubject.command1.isRunning(), true, "First command should be running");
        equal(testSubject.command2.isRunning(), false, "Second command should not be running");

        //start the second command running
        testSubject.command2();
        equal(testSubject.command1.isRunning(), true, "Both commands should now be running");
        equal(testSubject.command2.isRunning(), true, "Both commands should now be running");

        //allow the second command to complete
        deferred2.resolve();

        //check that only the second command has completed
        equal(testSubject.command1.isRunning(), true, "First command should still be running");
        equal(testSubject.command2.isRunning(), false, "Second command should have completed");
        equal(done1, false, "First command should not have invoked handlers");
        equal(done2, true, "Second command should have invoked handlers");

        //now let the first command complete and check it's properties
        deferred1.resolve();
        equal(testSubject.command1.isRunning(), false, "First command should now have completed");
        equal(done1, true, "First command should have invoked handlers");
    });

    test("canExecute returns true by default", function () {
        var command = ko.command(function () { });

        ok(command.canExecute(), "canExecute should return true unless something has been specified");
    });

    test("canExecute returns false whilst action is running", function () {
        var deferred = $.Deferred(),
            command = ko.command(function () { return deferred; });

        //execute the command
        command();

        //check that canExecute is false
        ok(!command.canExecute(), "canExecute should return false when the command is running");

        //allow the command to complete
        deferred.resolve();

        //check that the command can execute again
        ok(command.canExecute(), "canExecute should return true once the command completes");
    });

    test("canExecute returns true whilst action is running if abort is enabled", function () {
        var deferred = $.Deferred(),
            command = ko.command({
                concurrentExecution: "abortPendingRequest",
                action: function () { return deferred; }
            });

        //execute the command
        command();

        //check that canExecute is false
        ok(command.canExecute(), "canExecute should return true when the command is running");
    });

    test("canExecute returns true after action fails", function () {
        var deferred = $.Deferred(),
            command = ko.command(function () { return deferred; });

        //execute the command
        command();

        //check that canExecute is false
        ok(!command.canExecute(), "canExecute should return false when the command is running");

        //allow the command to fail
        deferred.reject();

        //check that the command can execute again
        ok(command.canExecute(), "canExecute should return true once the command fails");
    });

    test("canExecute returns false if options-specified item returns false", function () {
        var deferred = $.Deferred(),
            actionCanExecute = true,
            command = ko.command({
                action: function () { return deferred; },
                canExecute: function () { return actionCanExecute; }
            });

        //check initially can execute
        ok(command.canExecute(), "canExecute should return true when not running and when parameter canExecute is true");

        //now set the action's canExecute to false and check we can't execute
        actionCanExecute = false;
        command.canExecuteHasMutated();
        ok(!command.canExecute(), "canExecute should return false when the parameter canExecute is false");

        //fake a start to the execution and check that canExecute is still false
        command.isRunning(true);
        ok(!command.canExecute(), "canExecute should return false when the command is running");

        //now set the parameter canExecute to true and check canExecute is still false (we are still running)
        actionCanExecute = true;
        command.canExecuteHasMutated();
        ok(!command.canExecute(), "canExecute should return false when the command is running");

        //fake an end to the running
        command.isRunning(false);

        //check that the command can execute again
        ok(command.canExecute(), "canExecute should return true once the command stops running and the parameter-specified canExecute returns true");
    });

    test("canExecute is called in the context of the command", function () {
        var canExecuteContext,
            command = ko.command({
                action: function () { },
                canExecute: function () {
                    canExecuteContext = this;
                }
            });

        command.canExecute();

        equal(canExecuteContext, command, "canExecute should be called in the context of the command");
    });

    test("execute returns a completed deferred object when canExecute is false", function () {
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
        ok(!doneCalled, "The done handler should have been called");
        ok(failCalled, "The fail handler should have been called");
        ok(!command.isRunning(), "The command should not be running");
        ok(!actionCalled, "The action should not have been invoked");
    });

    var createDeferredWithAbort = function () {
        var deferred = $.Deferred();
        deferred.abort = function () {
            deferred.aborted = true;
        };
        return deferred;
    };

    test("execute aborts the pending request if abortPendingRequest is set", function () {
        var calls = [createDeferredWithAbort(), createDeferredWithAbort()],
            callCount = 0,
            command = ko.command({
                concurrentExecution: "abortPendingRequest",
                action: function () {
                    return calls[callCount++];
                }
            });

        //hook up a done handler
        var commandResult;
        command.done(function (result) {
            commandResult = result;
        });

        //execute the command twice
        command();
        command();

        //check that the first deferred object was aborted and that a second call was made
        ok(calls[0].aborted, "First (pending) request should have been aborted");
        equal(callCount, 2, "2 calls should have been made");

        //resolve the second call and check it updates output
        calls[1].resolve("result2");
        equal(commandResult, "result2", "Second result should update content");
    });

    test("failed is initially false", function () {
        var testSubject = ko.command(function () { });

        ok(!testSubject.failed(), "failed should initially return false");
    });

    test("failed is set to true when operation fails", function () {
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
        ok(!command.failed(), "failed should have been reset");

        //complete the async operation
        deferred.reject(responseData);

        //check the flag was set
        ok(command.failed(), "failed should have been set");
    });
});