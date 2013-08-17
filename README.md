# ko.plus

ko.plus is a collection of extensions to [KnockoutJs](http://knockoutjs.com/) that add to the core library.

## Installation
Get the ko.plus package [from NuGet](http://www.nuget.org/packages/ko.plus).

    Install-Package ko.plus

## ko.command

ko.command creates a representation of a command that exposes `isRunning`, `failed` and other observable properties to allow binding to command state.

The created commands can be invoked directly (as you would a normal function) and as such can be bound to the `click` handler.
They support both sychronous and asynchronous implementation code, and expose `done`, `fail` and `always` methods to allow continuations.

### Example Implementation

    function ViewModel() {
        this.doSomething = ko.command(function() {
            return $.get("...");
        })
        .done(function(data) {
            //do something with the response
        })
        .fail(function(error) {
            //handle the error
        });
    }

The state properties can be bound in the UI:

    <span data-bind="visible: doSomething.isRunning">Loading...</span>
    <span data-bind="visible: doSomething.failed">Something went wrong!</span>

### Options

#### action
The action function can be specified as the single parameter passed to `ko.command` or as the `action` property on an options object passed into the function.

    ko.command(function() { /*...*/ });
    //or
    ko.command({
        action: function() { /*...*/ })
    });

#### canExecute
An optional `canExecute` function can be specified to determine whether or not a command can currently be executed.

    function ViewModel() {
        this.doSomething = ko.command({
            action: function() {
                return $.get("...");
            },
            canExecute: function() {
                //validation logic
                return true;
            }
        });
    }

Note: the function passed as `canExecute` will be wrapped in a `ko.computed`, so if it uses other observable properties it will automatically be updated.
If you need to manually inform a command that the value of `canExecute` has changed then you can call the `canExecuteHasMutated` function, which will force a reevaluation.

#### context
The `context` option sets the context in which the callbacks and action functions will be executed.

    function ViewModel() {
        this.url = "...";

        this.doSomething = ko.command({
            action: function() {
                return $.get(this.url);
            },
            context: this
        });
    }

### Properties

#### isRunning
An observable that indicates whether or not the command is currently running.

#### canExecute
A computed observable that indicates whether or not the command is currently able to execute.

#### failed
An observable that indicates whether or not the last invocation of the command failed.

### Functions

#### done
Attach a callback that will be invoked when the command completes successfully.

#### fail
Attach a callback that will be invoked when the command fails.

#### always
Attach a callback that will be invoked when the command either completes successfully or fails.

### Further Reading

* [Introductory Blog Post](http://blog.greatrexpectations.com/2012/06/26/command-pattern-with-jquery-deferred-knockout/)
* [Updated Blog Post](http://blog.greatrexpectations.com/2012/07/12/command-pattern-v2-using-knockout/)
* [Handling Context](http://blog.greatrexpectations.com/2013/07/29/handling-this-in-ko-command/)

## ko.editable & ko.editableArray

ko.editable creates an extendion of `ko.observable` with some additional properties to aid in beginning, cancelling and committing changes.
ko.editableArray does the same for instances of `ko.observableArray`.

### Example Implementation

    function ViewModel() {
       this.value = ko.editable(123);
    }

    var instance = new ViewModel();
    //instance.value -> 123

    instance.value.beginEdit();
    instance.value(456);
    //instance.value -> 456

    instance.value.cancelEdit();
    //instance.value -> 123

### Properties

#### isEditing
An observable property that indicates whether or not the editable is currently in edit mode.

### Functions

#### beginEdit
Puts the editable into edit mode.

#### endEdit
Takes the editable out of edit mode, commiting any changes.

#### cancelEdit
Takes the editable out of edit mode and reverts to value at the point when `beginEdit` was called.

#### rollback
Without changing edit state, reverts back through historically committed values for this editable until it reaches the original value.

### Further Reading

*  [Introductory Blog Post](http://blog.greatrexpectations.com/2012/09/20/editable-fields-with-cancelability-in-knockout/)

## ko.makeEditable

ko.makeEditable adds to the functionality of `ko.editable` and `ko.editableArray` (which only apply to single properties) and expands to allow object graphs to be editable.

This works by appending `beginEdit`, `cancelEdit`, `endEdit` and `rollback` methods to the target object that will visit all child properties and, if they are editable, invoke the appropriate function.

The function will be applied recursively to:

 *  immediate child properties that are editable (whether instances of `ko.editable` or other editable view models)
 *  any editable objects found in child arrays (either editable arrays or normal)

### Example Implementation

    function ViewModel() {
        this.property1 = ko.editable();
        this.property2 = ko.editable();
        this.arrayProperty = ko.editableArray([
            ko.editable(),
            ko.editable()
        ]);

        ko.makeEditable(this);
    }

    var instance = new ViewModel();
    instance.beginEdit();
    
    instance.property1.isEditing(); // -> true
    instance.property2.isEditing(); // -> true
    instance.property1.isEditing(); // -> true

### Properties

#### isEditing
An observable property that indicates whether or not the editable is currently in edit mode.

### Functions

#### beginEdit
Puts the editable and all child editables into edit mode.

#### endEdit
Takes the editable and all child editables out of edit mode, commiting any changes.

#### cancelEdit
Takes the editable and all child editables out of edit mode and reverts to value at the point when `beginEdit` was called.

#### rollback
Without changing edit state, reverts back through historically committed values for this editable until it reaches the original value for all child editables.

### Further Reading

*  [Introductory Blog Post](http://blog.greatrexpectations.com/2013/05/29/editable-object-graphs-in-knockout/)

## ko.bindingHandlers.loadingWhen

The `loadingWhen` custom binding handler replaces the contents of a container element with a loading placeholder when the bound value is truthy.

### Example Implementation

    <div data-bind="loadingWhen: someAction.isRunning">
		<p>This will content will be replaced when someAction.isRunning</p>
	</div>

### Options

#### loaderClass
The loading element is automatically assigned the `.loader` class (defined in `ko.plus.css`).  
The `loaderClass` property specifies what additional class will be assigned to the loading element that sets the loading spinner.

The default option is `loader-dark` (grey spinner on a transparent background), and the default `ko.plus.css` stylesheet contains a `loader-white` option (white spinner on a transparent background).

Non-default loader classes can also be assigned.

### Further Reading

*  [Introductory Blog post](http://blog.greatrexpectations.com/2012/06/17/loading-placeholders-using-knockout-js/)

## ko.bindingHandlers.command

The `command` custom binding handler applies the following bindings for a `ko.command` instance specified through the `valueAccessor`:
*  `click` bound to the command
*  `loadingWhen` bound to `command.isRunning`
*  `enable` bound to `command.canExecute`

### Example Implementation

    <button data-bind="command: someAction">Do Something</button>
