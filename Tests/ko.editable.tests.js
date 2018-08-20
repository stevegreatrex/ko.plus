/*global ko: false, module: false, test: false, raises: false, equal: false, ok: false, deepEqual: false*/

define(['qunit'], function(QUnit) {
	'use strict';

	var throttle = ko.extenders.throttle;
	QUnit.module('ko.editable Tests', {
		beforeEach: function(assert) {
			delete ko.extenders.throttle;
		},
		afterEach: function(assert) {
			ko.extenders.throttle = throttle;
		}
	});

	QUnit.test('editable creates observable object', function (assert) {
		var editable = ko.editable();

		assert.ok(editable, 'The result should not be null');
		assert.equal(null, editable(), 'The result should be an executable function');
		assert.ok(editable.subscribe, 'The result should be observable');
	});

	QUnit.test('editable sets initial value', function (assert) {
		var editable = ko.editable('initial');

		assert.equal('initial', editable(), 'The initial value should be the constructor-specified initialiser');
	});

	QUnit.test('editable sets editing flag', function (assert) {
		var editable = ko.editable();

		assert.equal(false, editable.isEditing(), 'isEditing should be set to false');
	});

	QUnit.test('beginEdit method sets editing flag to true', function (assert) {
		var editable = ko.editable();

		editable.beginEdit();
		assert.equal(true, editable.isEditing(), 'isEditing should have been set to true');

		editable.beginEdit();
		assert.equal(true, editable.isEditing(), 'isEditing should not have been changed');
	});

	QUnit.test('endEdit does nothing when beginEdit has not been called', function (assert) {
		var editable = ko.editable();
		editable.endEdit();
		assert.equal(false, editable.isEditing(), 'isEditing should not have been changed');
	});

	QUnit.test('cancelEdit does nothing when beginEdit has not been called', function (assert) {
		var editable = ko.editable();
		editable.cancelEdit();
		assert.equal(false, editable.isEditing(), 'isEditing should not have been changed');
	});

	QUnit.test('cancelEdit reverts changes', function (assert) {
		var editable = ko.editable();

		editable.beginEdit();
		editable('new value');
		editable.cancelEdit();

		assert.equal(null, editable(), 'The old value should have been restored');

		editable('another value');
		editable.beginEdit();
		editable('another new value');
		editable.cancelEdit();

		assert.equal('another value', editable(), 'The old value should have been restored');

		//cancel a couple more times to check no more changes are undone
		editable.cancelEdit();
		editable.cancelEdit();
		assert.equal('another value', editable(), 'No further changes should have been undone');
	});

	QUnit.test('cancelEdit has not effect after endEdit', function (assert) {
		var editable = ko.editable();

		editable.beginEdit();
		editable('new value');
		editable.endEdit();
		editable.cancelEdit();
		assert.equal('new value', editable(), 'The value of editable should not have been reverted');
	});

	QUnit.test('rollback does nothing when no history is available', function (assert) {
		var editable = ko.editable('initial');

		editable.rollback();

		assert.equal('initial', editable(), 'The value should not have been changed');
	});

	QUnit.test('rollback restores committed changes', function (assert) {
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
				assert.equal(editable(), 'edited value');

				//in edit mode, rollback should act link Cancel without setting
				//the isEditing flag
				editable.rollback();
				assert.equal(editable(), 'duplicate');
				assert.ok(editable.isEditing(), 'Should still be editing');
			}

			//should currently have the last committed value
			assert.equal(editable(), 'duplicate');

			//now, rollback through the committed values
			editable.rollback();
			assert.equal(editable(), 'committed 2');

			editable.rollback();
			assert.equal(editable(), 'duplicate'); //first duplicate value

			editable.rollback();
			assert.equal(editable(), 'duplicate'); //second duplicate value

			editable.rollback();
			assert.equal(editable(), 'committed 1');

			editable.rollback();
			assert.equal(editable(), 'initial');

			editable.rollback();
			assert.equal(editable(), 'initial');
		};

		testRollback(true); //rollback whilst in edit mode
		testRollback(false); //rollback whilst not in edit mode
	});

	QUnit.test('undoCancel restores cancelled changes', function (assert) {
		var editable = ko.editable('initial');

		//commit some changes
		editable.beginEdit(); editable('committed 1'); editable.endEdit();
		editable.beginEdit(); editable('committed 2'); editable.endEdit();

		//make, then cancel some more changes
		editable.beginEdit();
		editable('cancelled');
		editable.cancelEdit();

		assert.equal(editable(), 'committed 2');
		editable.undoCancel();

		assert.equal(editable(), 'cancelled');
		assert.ok(editable.isEditing());

		//second undoCancel should be ignored
		editable.undoCancel();
		assert.equal(editable(), 'cancelled');
		assert.ok(editable.isEditing());

		editable.cancelEdit();
		assert.equal(editable(), 'committed 2');
	});

	QUnit.test('undoCancel does nothing when no changes have been cancelled', function (assert) {
		var editable = ko.editable('initial');
		editable.undoCancel();

		assert.equal(editable(), 'initial', 'No change should have been made');
		assert.ok(!editable.isEditing(), 'Should not have started editing');
	});

	QUnit.test('undoCancel does nothing after a rollback', function (assert) {
		var editable = ko.editable('initial');

		//commit some changes
		editable.beginEdit(); editable('committed 1'); editable.endEdit();
		editable.beginEdit(); editable('committed 2'); editable.endEdit();

		//make, then cancel some more changes
		editable.beginEdit(); editable('cancelled'); editable.cancelEdit();

		//rollback to the previous committed version
		assert.equal(editable(), 'committed 2');
		editable.rollback();
		assert.equal(editable(), 'committed 1');

		//check that undoCancel now does nothing
		editable.undoCancel();
		assert.equal(editable(), 'committed 1');
		assert.ok(!editable.isEditing());
	});

	QUnit.test('undoCancel does nothing after a beginEdit', function (assert) {
		var editable = ko.editable('initial');

		//commit some changes
		editable.beginEdit(); editable('committed 1'); editable.endEdit();
		editable.beginEdit(); editable('committed 2'); editable.endEdit();

		//make, then cancel some more changes
		editable.beginEdit(); editable('cancelled'); editable.cancelEdit();

		//begin a new edit
		assert.equal(editable(), 'committed 2');
		editable.beginEdit();
		assert.equal(editable(), 'committed 2');

		//check that undoCancel now does nothing
		editable.undoCancel();
		assert.equal(editable(), 'committed 2');
		assert.ok(editable.isEditing());
	});

	QUnit.test('makeEditable throws when passed a null target', function (assert) {
		assert.raises(function () {
			ko.editable.makeEditable(null);
		}, /Target must be specified/);
	});

	QUnit.test('makeEditable adds the editing methods to the target', function (assert) {
		var target = {};

		ko.editable.makeEditable(target);

		assert.ok(target.isEditing, 'isEditing should have been added');
		assert.ok(!target.isEditing(), 'isEditing should be false');
		assert.ok(target.beginEdit, 'beginEdit should have been added');
		assert.ok(target.endEdit, 'endEdit should have been added');
		assert.ok(target.cancelEdit, 'cancelEdit should have been added');
		assert.ok(target.rollback, 'rollback should have been added');
		assert.ok(target.undoCancel, 'undoCancel should have been added');
	});

	QUnit.test('makeEditable methods affect isEditing correctly', function (assert) {
		var target = {};

		ko.editable.makeEditable(target);

		assert.ok(!target.isEditing());

		target.endEdit();
		target.cancelEdit();
		assert.ok(!target.isEditing());

		target.beginEdit();
		target.beginEdit();
		assert.ok(target.isEditing());

		target.endEdit();
		assert.ok(!target.isEditing());

		target.beginEdit();
		target.cancelEdit();
		assert.ok(!target.isEditing());

		target.undoCancel();
		assert.ok(target.isEditing());
	});

	QUnit.test('makeEditable methods affect child properties', function (assert) {
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
			assert.ok(editable.isEditing(), message);
		},

		isNotEditing = function (editable, message) {
			assert.ok(!editable.isEditing(), message);
		},

		setValue = function (editable) {
			editable('new value');
		},

		isNewValue = function (editable, message) {
			assert.equal(editable(), 'new value', message);
		},

		isInitialValue = function (editable, message) {
			assert.equal(editable(), 'initial', message);
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

	QUnit.test('makeEditable undoCancel honours isEditable', function (assert) {
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
		assert.equal(target.value(), 'updated', 'Cancelled value should have been rolled back');
		assert.equal(target.isEditing(), false, 'Should not be editing though - isEditable is false');

	});

	QUnit.test('editableArray behaves as a regular editable', function (assert) {
		var editableArray = ko.editableArray();
		assert.equal(editableArray().length, 0, 'Default array should be empty');

		editableArray.push(1);
		editableArray.push(2);
		editableArray.push(3);
		assert.deepEqual(editableArray(), [1, 2, 3], 'make changes failed');

		editableArray.beginEdit();

		//make changes
		editableArray.splice(0, 2);
		editableArray.push(4);
		editableArray.push(1); // == re-ordering
		assert.deepEqual(editableArray(), [3, 4, 1], 'make changes failed');

		//cancel
		editableArray.cancelEdit();
		assert.deepEqual(editableArray(), [1, 2, 3], 'cancel failed');

		//undo cancel
		editableArray.undoCancel();
		assert.deepEqual(editableArray(), [3, 4, 1], 'undoCancel failed');
		editableArray.cancelEdit();

		//commit
		editableArray.beginEdit();
		editableArray.push(4);
		editableArray.endEdit();
		assert.deepEqual(editableArray(), [1, 2, 3, 4], 'commit failed');

		//rollback
		editableArray.rollback();
		assert.deepEqual(editableArray(), [1, 2, 3], 'rollback failed');
	});

	QUnit.test('editableArray cancel editing on removed array elements', function (assert) {
		var arrayWrapper = {
			editableArray: ko.editableArray()
		};

		ko.editable.makeEditable(arrayWrapper);

		assert.equal(arrayWrapper.editableArray().length, 0, 'Default array should be empty');

		var prop1 = ko.editable(1),
			prop2 = ko.editable(2),
			prop3 = ko.editable(3);

		arrayWrapper.editableArray.push(prop1);
		arrayWrapper.editableArray.push(prop2);
		arrayWrapper.editableArray.push(prop3);
		assert.deepEqual(arrayWrapper.editableArray(), [prop1, prop2, prop3], 'make changes failed');

		arrayWrapper.beginEdit();
		assert.ok(prop1.isEditing(), 'should be editing prop1');
		assert.ok(prop2.isEditing(), 'should be editing prop2');
		assert.ok(prop3.isEditing(), 'should be editing prop3');

		//make changes
		arrayWrapper.editableArray.splice(0, 2);

		//cancel
		arrayWrapper.cancelEdit();
		assert.deepEqual(arrayWrapper.editableArray(), [prop1, prop2, prop3], 'cancel failed');
		assert.ok(!prop1.isEditing(), 'should not be editing prop1');
		assert.ok(!prop2.isEditing(), 'should not be editing prop2');
		assert.ok(!prop3.isEditing(), 'should not be editing prop3');
	});

	QUnit.test('editableArray uses initial value correctly', function (assert) {
		var initial = ko.editableArray([1, 2, 3]),
			noInitial = ko.editableArray(),
			nullInitial = ko.editableArray(null),
			undefinedInitial = ko.editableArray(undefined);

		assert.deepEqual(initial(), [1, 2, 3]);
		assert.deepEqual(noInitial(), []);
		assert.deepEqual(nullInitial(), []);
		assert.deepEqual(undefinedInitial(), []);

	});

	QUnit.test('can be used through extenders', function (assert) {
		var target = ko.observable().extend({ editable: true });

		assert.ok(target.isEditing, 'Target should have been made editable');
		assert.ok(target.beginEdit, 'Target should have been made editable');
		assert.ok(target.cancelEdit, 'Target should have been made editable');
	});

	QUnit.test('isEditable is respected on individual observables', function (assert) {
		var target = ko.editable();

		target.isEditable = ko.observable(false);
		target.beginEdit();
		assert.ok(!target.isEditing(), 'Should not start editing');

		target.isEditable(true);
		target.beginEdit();
		assert.ok(target.isEditing(), 'Should now start editing');
	});

	QUnit.test('isDirty computed respects value changes for scalar values', function (assert) {
		var target = ko.editable();
		assert.ok(!target.isDirty(), 'isDirty should initially be false');

		target('initial value');
		assert.ok(!target.isDirty(), 'isDirty should be false when value changes if not editing');

		target.beginEdit();
		assert.ok(!target.isDirty(), 'isDirty should be false when editing unless value changes');

		target('new value');
		assert.ok(target.isDirty(), 'isDirty should be true when the value changes');

		target('new value 2');
		assert.ok(target.isDirty(), 'isDirty should be true when the value changes');

		target('new value');
		assert.ok(target.isDirty(), 'isDirty should be true when the value changes');

		target('initial value');
		assert.ok(!target.isDirty(), 'isDirty should only be true when the value != original value');

		target('new value');
		target.endEdit();
		assert.ok(!target.isDirty(), 'isDirty should be false when the value is committed');

		target.beginEdit();
		target('new value 2');
		target.cancelEdit();
		assert.ok(!target.isDirty(), 'isDirty should be false when the edit is cancelled');
	});

	QUnit.test('isDirty computed respects value changes for complex values', function (assert) {
		var target = ko.editable();
		target({ value: 'initial value' });
		assert.ok(!target.isDirty(), 'isDirty should be false when value changes if not editing');

		target.beginEdit();
		assert.ok(!target.isDirty(), 'isDirty should be false when editing unless value changes');

		target({ value: 'new value' });
		assert.ok(target.isDirty(), 'isDirty should be true when the value changes');

		target({ value: 'new value 2' });
		assert.ok(target.isDirty(), 'isDirty should be true when the value changes');

		target({ value: 'new value' });
		assert.ok(target.isDirty(), 'isDirty should be true when the value changes');

		target({ value: 'initial value' });
		assert.ok(!target.isDirty(), 'isDirty should only be true when the value != original value');

		target({ value: 'new value' });
		target.endEdit();
		assert.ok(!target.isDirty(), 'isDirty should be false when the value is committed');

		target.beginEdit();
		target({ value: 'new value 2' });
		target.cancelEdit();
		assert.ok(!target.isDirty(), 'isDirty should be false when the edit is cancelled');
	});

	QUnit.test('isDirty computed on editable objects respects child value changes', function (assert) {
		var target = ko.editable.makeEditable({
			scalar: ko.editable('initial value'),
			array: ko.editableArray([1, 2])
		});

		assert.ok(!target.isDirty(), 'no child elements have changed');

		target.beginEdit();
		assert.ok(!target.isDirty(), 'no child elements have changed');

		target.scalar('new value');
		assert.ok(target.isDirty(), 'child value has changed');

		target.scalar('initial value');
		target.array([1, 2, 3]);
		assert.ok(target.isDirty(), 'child value has changed');

		target.array([1, 2]);
		assert.ok(!target.isDirty(), 'no child elements have changed');
	});
});