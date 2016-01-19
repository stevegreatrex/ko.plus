/*global ko: false, module: false, test: false, raises: false, equal: false, ok: false, deepEqual: false*/

(function ($, ko) {
	'use strict';

	module('ko.editable Tests');

	test('editable creates observable object', function () {
		var editable = ko.editable();

		ok(editable, 'The result should not be null');
		equal(null, editable(), 'The result should be an executable function');
		ok(editable.subscribe, 'The result should be observable');
	});

	test('editable sets initial value', function () {
		var editable = ko.editable('initial');

		equal('initial', editable(), 'The initial value should be the constructor-specified initialiser');
	});

	test('editable sets editing flag', function () {
		var editable = ko.editable();

		equal(false, editable.isEditing(), 'isEditing should be set to false');
	});

	test('beginEdit method sets editing flag to true', function () {
		var editable = ko.editable();

		editable.beginEdit();
		equal(true, editable.isEditing(), 'isEditing should have been set to true');

		editable.beginEdit();
		equal(true, editable.isEditing(), 'isEditing should not have been changed');
	});

	test('endEdit does nothing when beginEdit has not been called', function () {
		var editable = ko.editable();
		editable.endEdit();
		equal(false, editable.isEditing(), 'isEditing should not have been changed');
	});

	test('cancelEdit does nothing when beginEdit has not been called', function () {
		var editable = ko.editable();
		editable.cancelEdit();
		equal(false, editable.isEditing(), 'isEditing should not have been changed');
	});

	test('cancelEdit reverts changes', function () {
		var editable = ko.editable();

		editable.beginEdit();
		editable('new value');
		editable.cancelEdit();

		equal(null, editable(), 'The old value should have been restored');

		editable('another value');
		editable.beginEdit();
		editable('another new value');
		editable.cancelEdit();

		equal('another value', editable(), 'The old value should have been restored');

		//cancel a couple more times to check no more changes are undone
		editable.cancelEdit();
		editable.cancelEdit();
		equal('another value', editable(), 'No further changes should have been undone');
	});

	test('cancelEdit has not effect after endEdit', function () {
		var editable = ko.editable();

		editable.beginEdit();
		editable('new value');
		editable.endEdit();
		editable.cancelEdit();
		equal('new value', editable(), 'The value of editable should not have been reverted');
	});

	test('rollback does nothing when no history is available', function () {
		var editable = ko.editable('initial');

		editable.rollback();

		equal('initial', editable(), 'The value should not have been changed');
	});

	test('rollback restores committed changes', function () {
		var testRollback = function (rollbackWhilstEditing) {
			var editable = ko.editable('initial');

			//commit some changes
			editable.beginEdit();
			editable('uncommitted 1');
			editable('committed 1');
			editable.endEdit();

			//make, then cancel some more changes
			editable.beginEdit();
			editable('cancelled');
			editable.cancelEdit();

			//commit 2 duplicate values (make sure they aren't treated as one)
			editable.beginEdit(); editable('duplicate'); editable.endEdit();
			editable.beginEdit(); editable('duplicate'); editable.endEdit();

			//now commit some more changes
			editable.beginEdit();
			editable('uncommitted 2');
			editable('committed 2');
			editable.endEdit();

			//commit a third duplicate value
			editable.beginEdit(); editable('duplicate'); editable.endEdit();

			//do we want to be rolling-back whilst in edit mode?
			if (rollbackWhilstEditing) {
				editable.beginEdit();
				editable('edited value');
				equal(editable(), 'edited value');

				//in edit mode, rollback should act link Cancel without setting
				//the isEditing flag
				editable.rollback();
				equal(editable(), 'duplicate');
				ok(editable.isEditing(), 'Should still be editing');
			}

			//should currently have the last committed value
			equal(editable(), 'duplicate');

			//now, rollback through the committed values
			editable.rollback();
			equal(editable(), 'committed 2');

			editable.rollback();
			equal(editable(), 'duplicate'); //first duplicate value

			editable.rollback();
			equal(editable(), 'duplicate'); //second duplicate value

			editable.rollback();
			equal(editable(), 'committed 1');

			editable.rollback();
			equal(editable(), 'initial');

			editable.rollback();
			equal(editable(), 'initial');
		};

		testRollback(true); //rollback whilst in edit mode
		testRollback(false); //rollback whilst not in edit mode
	});

	test('undoCancel restores cancelled changes', function () {
		var editable = ko.editable('initial');

		//commit some changes
		editable.beginEdit(); editable('committed 1'); editable.endEdit();
		editable.beginEdit(); editable('committed 2'); editable.endEdit();

		//make, then cancel some more changes
		editable.beginEdit();
		editable('cancelled');
		editable.cancelEdit();

		equal(editable(), 'committed 2');
		editable.undoCancel();

		equal(editable(), 'cancelled');
		ok(editable.isEditing());

		//second undoCancel should be ignored
		editable.undoCancel();
		equal(editable(), 'cancelled');
		ok(editable.isEditing());

		editable.cancelEdit();
		equal(editable(), 'committed 2');
	});

	test('undoCancel does nothing when no changes have been cancelled', function () {
		var editable = ko.editable('initial');
		editable.undoCancel();

		equal(editable(), 'initial', 'No change should have been made');
		ok(!editable.isEditing(), 'Should not have started editing');
	});

	test('undoCancel does nothing after a rollback', function () {
		var editable = ko.editable('initial');

		//commit some changes
		editable.beginEdit(); editable('committed 1'); editable.endEdit();
		editable.beginEdit(); editable('committed 2'); editable.endEdit();

		//make, then cancel some more changes
		editable.beginEdit(); editable('cancelled'); editable.cancelEdit();

		//rollback to the previous committed version
		equal(editable(), 'committed 2');
		editable.rollback();
		equal(editable(), 'committed 1');

		//check that undoCancel now does nothing
		editable.undoCancel();
		equal(editable(), 'committed 1');
		ok(!editable.isEditing());
	});

	test('undoCancel does nothing after a beginEdit', function () {
		var editable = ko.editable('initial');

		//commit some changes
		editable.beginEdit(); editable('committed 1'); editable.endEdit();
		editable.beginEdit(); editable('committed 2'); editable.endEdit();

		//make, then cancel some more changes
		editable.beginEdit(); editable('cancelled'); editable.cancelEdit();

		//begin a new edit
		equal(editable(), 'committed 2');
		editable.beginEdit();
		equal(editable(), 'committed 2');

		//check that undoCancel now does nothing
		editable.undoCancel();
		equal(editable(), 'committed 2');
		ok(editable.isEditing());
	});

	test('makeEditable throws when passed a null target', function () {
		raises(function () {
			ko.editable.makeEditable(null);
		}, /Target must be specified/);
	});

	test('makeEditable adds the editing methods to the target', function () {
		var target = {};

		ko.editable.makeEditable(target);

		ok(target.isEditing, 'isEditing should have been added');
		ok(!target.isEditing(), 'isEditing should be false');
		ok(target.beginEdit, 'beginEdit should have been added');
		ok(target.endEdit, 'endEdit should have been added');
		ok(target.cancelEdit, 'cancelEdit should have been added');
		ok(target.rollback, 'rollback should have been added');
		ok(target.undoCancel, 'undoCancel should have been added');
	});

	test('makeEditable methods affect isEditing correctly', function () {
		var target = {};

		ko.editable.makeEditable(target);

		ok(!target.isEditing());

		target.endEdit();
		target.cancelEdit();
		ok(!target.isEditing());

		target.beginEdit();
		target.beginEdit();
		ok(target.isEditing());

		target.endEdit();
		ok(!target.isEditing());

		target.beginEdit();
		target.cancelEdit();
		ok(!target.isEditing());

		target.undoCancel();
		ok(target.isEditing());
	});

	test('makeEditable methods affect child properties', function () {
		var target = {
			level1: ko.editable('initial'),
			childList: [
				ko.editable('initial'),
				ko.editable('initial')
			],
			observableChildList: ko.observableArray([
				ko.editable('initial'),
				ko.editable('initial')
			])
		},

		//helper methods
		eachTargetEditable = function (action, message) {
			action(target.level1, '(level1) ' + message);
			action(target.childList[0], '(childList) ' + message);
			action(target.childList[1], '(childList) ' + message);
			action(target.observableChildList()[0], '(observableChildList) ' + message);
			action(target.observableChildList()[1], '(observableChildList) ' + message);
		},

		isEditing = function (editable, message) {
			ok(editable.isEditing(), message);
		},

		isNotEditing = function (editable, message) {
			ok(!editable.isEditing(), message);
		},

		setValue = function (editable) {
			editable('new value');
		},

		isNewValue = function (editable, message) {
			equal(editable(), 'new value', message);
		},

		isInitialValue = function (editable, message) {
			equal(editable(), 'initial', message);
		},

		rollback = function (editable) {
			editable.rollback();
		};

		//tests
		ko.editable.makeEditable(target);
		eachTargetEditable(isNotEditing, 'Should initially not be editing');
		eachTargetEditable(isInitialValue, 'All values should be set to the initial value');

		target.beginEdit();
		eachTargetEditable(isEditing, 'Should now be editing');
		eachTargetEditable(setValue);
		eachTargetEditable(isNewValue, 'The new value should have been applied to all editables');

		target.cancelEdit();
		eachTargetEditable(isNotEditing, 'Edit should have been cancelled');
		eachTargetEditable(isInitialValue, 'All values should have been reset');

		target.undoCancel();
		eachTargetEditable(isEditing, 'Should have re-entered edit mode');
		eachTargetEditable(isNewValue, 'Should have reverted to the cancelled value');
		target.cancelEdit();

		target.beginEdit();
		eachTargetEditable(isEditing, 'Should now be editing');
		eachTargetEditable(setValue);
		target.endEdit();
		eachTargetEditable(isNotEditing, 'Edit should have been confirmed');
		eachTargetEditable(isNewValue, 'The new value should have been confirmed');

		eachTargetEditable(rollback);
		eachTargetEditable(isInitialValue, 'All values should have been rolled back');
	});

	test('makeEditable undoCancel honours isEditable', function () {
		var isEditable = true,
			target = {
				value: ko.editable(),
				isEditable: function () { return isEditable; }
			};

		ko.editable.makeEditable(target);

		target.beginEdit();
		target.value('updated');
		target.cancelEdit();

		isEditable = false;
		target.undoCancel();
		equal(target.value(), 'updated', 'Cancelled value should have been rolled back');
		equal(target.isEditing(), false, 'Should not be editing though - isEditable is false');

	});

	test('editableArray behaves as a regular editable', function () {
		var editableArray = ko.editableArray();
		equal(editableArray().length, 0, 'Default array should be empty');

		editableArray.push(1);
		editableArray.push(2);
		editableArray.push(3);
		deepEqual(editableArray(), [1, 2, 3], 'make changes failed');

		editableArray.beginEdit();

		//make changes
		editableArray.splice(0, 2);
		editableArray.push(4);
		editableArray.push(1); // == re-ordering
		deepEqual(editableArray(), [3, 4, 1], 'make changes failed');

		//cancel
		editableArray.cancelEdit();
		deepEqual(editableArray(), [1, 2, 3], 'cancel failed');

		//undo cancel
		editableArray.undoCancel();
		deepEqual(editableArray(), [3, 4, 1], 'undoCancel failed');
		editableArray.cancelEdit();

		//commit
		editableArray.beginEdit();
		editableArray.push(4);
		editableArray.endEdit();
		deepEqual(editableArray(), [1, 2, 3, 4], 'commit failed');

		//rollback
		editableArray.rollback();
		deepEqual(editableArray(), [1, 2, 3], 'rollback failed');
	});

	test('editableArray cancel editing on removed array elements', function () {
		var arrayWrapper = {
			editableArray: ko.editableArray()
		};

		ko.editable.makeEditable(arrayWrapper);

		equal(arrayWrapper.editableArray().length, 0, 'Default array should be empty');

		var prop1 = ko.editable(1),
			prop2 = ko.editable(2),
			prop3 = ko.editable(3);

		arrayWrapper.editableArray.push(prop1);
		arrayWrapper.editableArray.push(prop2);
		arrayWrapper.editableArray.push(prop3);
		deepEqual(arrayWrapper.editableArray(), [prop1, prop2, prop3], 'make changes failed');

		arrayWrapper.beginEdit();
		ok(prop1.isEditing(), 'should be editing prop1');
		ok(prop2.isEditing(), 'should be editing prop2');
		ok(prop3.isEditing(), 'should be editing prop3');

		//make changes
		arrayWrapper.editableArray.splice(0, 2);

		//cancel
		arrayWrapper.cancelEdit();
		deepEqual(arrayWrapper.editableArray(), [prop1, prop2, prop3], 'cancel failed');
		ok(!prop1.isEditing(), 'should not be editing prop1');
		ok(!prop2.isEditing(), 'should not be editing prop2');
		ok(!prop3.isEditing(), 'should not be editing prop3');
	});

	test('editableArray uses initial value correctly', function () {
		var initial = ko.editableArray([1, 2, 3]),
			noInitial = ko.editableArray(),
			nullInitial = ko.editableArray(null),
			undefinedInitial = ko.editableArray(undefined);

		deepEqual(initial(), [1, 2, 3]);
		deepEqual(noInitial(), []);
		deepEqual(nullInitial(), []);
		deepEqual(undefinedInitial(), []);

	});

	test('can be used through extenders', function() {
		var target = ko.observable().extend({ editable: true });

		ok(target.isEditing, 'Target should have been made editable');
		ok(target.beginEdit, 'Target should have been made editable');
		ok(target.cancelEdit, 'Target should have been made editable');
	});

	test('isEditable is respected on individual observables', function () {
		var target = ko.editable();

		target.isEditable = ko.observable(false);
		target.beginEdit();
		ok(!target.isEditing(), 'Should not start editing');

		target.isEditable(true);
		target.beginEdit();
		ok(target.isEditing(), 'Should now start editing');
	});

	test('isDirty computed respects value changes for scalar values', function () {
		var target = ko.editable();
		ok(!target.isDirty(), 'isDirty should initially be false');

		target('initial value');
		ok(!target.isDirty(), 'isDirty should be false when value changes if not editing');

		target.beginEdit();
		ok(!target.isDirty(), 'isDirty should be false when editing unless value changes');

		target('new value');
		ok(target.isDirty(), 'isDirty should be true when the value changes');

		target('new value 2');
		ok(target.isDirty(), 'isDirty should be true when the value changes');

		target('new value');
		ok(target.isDirty(), 'isDirty should be true when the value changes');

		target('initial value');
		ok(!target.isDirty(), 'isDirty should only be true when the value != original value');

		target('new value');
		target.endEdit();
		ok(!target.isDirty(), 'isDirty should be false when the value is committed');

		target.beginEdit();
		target('new value 2');
		target.cancelEdit();
		ok(!target.isDirty(), 'isDirty should be false when the edit is cancelled');
	});

	test('isDirty computed respects value changes for complex values', function () {
		var target = ko.editable();
		target({ value: 'initial value' });
		ok(!target.isDirty(), 'isDirty should be false when value changes if not editing');

		target.beginEdit();
		ok(!target.isDirty(), 'isDirty should be false when editing unless value changes');

		target({ value: 'new value' });
		ok(target.isDirty(), 'isDirty should be true when the value changes');

		target({ value: 'new value 2' });
		ok(target.isDirty(), 'isDirty should be true when the value changes');

		target({ value: 'new value' });
		ok(target.isDirty(), 'isDirty should be true when the value changes');

		target({ value: 'initial value' });
		ok(!target.isDirty(), 'isDirty should only be true when the value != original value');

		target({ value: 'new value' });
		target.endEdit();
		ok(!target.isDirty(), 'isDirty should be false when the value is committed');

		target.beginEdit();
		target({ value: 'new value 2' });
		target.cancelEdit();
		ok(!target.isDirty(), 'isDirty should be false when the edit is cancelled');
	});

	test('isDirty computed on editable objects respects child value changes', function () {
		var target = ko.editable.makeEditable({
			scalar: ko.editable('initial value'),
			array: ko.editableArray([1, 2])
		});

		ok(!target.isDirty(), 'no child elements have changed');

		target.beginEdit();
		ok(!target.isDirty(), 'no child elements have changed');

		target.scalar('new value');
		ok(target.isDirty(), 'child value has changed');

		target.scalar('initial value');
		target.array([1, 2, 3]);
		ok(target.isDirty(), 'child value has changed');

		target.array([1, 2]);
		ok(!target.isDirty(), 'no child elements have changed');
	});
}(jQuery, ko));