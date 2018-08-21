/*global ko: false, module: false, test: false, raises: false, equal: false, ok: false, deepEqual: false*/

define(['qunit'], function(QUnit) {
	'use strict';

	QUnit.module('ko.sortable Tests');

	QUnit.test('defaults to basic sort', function(assert) {
		var source = ko.observableArray([2,3,1]);
		var sorted = source.extend({ sortable: true });

		assert.deepEqual(sorted(), [1,2,3], 'Should have been sorted by default');
	});

	QUnit.test('sorted list updates when parent list changes', function(assert) {
		var source = ko.observableArray([2,3,1]);
		var sorted = source.extend({ sortable: true });

		source.push(-3);

		assert.deepEqual(sorted(), [-3,1,2,3], 'Should have been updated');
	});

	QUnit.test('can sort by property name', function(assert) {
		var source = ko.observableArray([
			{ id: 4 },
			{ id: 1 },
			{ id: 2 }
		]).extend({
				sortable: {
					key: 'id'
			}
		});

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			1, 2, 4
		], 'should have sorted by id');

		source.push({ id: 3 });

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			1, 2, 3, 4
		], 'should have sorted by id');
	});

	QUnit.test('sorts null string keys to top', function(assert) {
		var source = ko.observableArray([
			{ id: 'a' },
			{ id: null },
			{ id: 'b' },
			{ id: null }
		]).extend({
			sortable: {
				key: 'id'
			}
		});

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			null, null, 'a', 'b'
		], 'should have sorted null values to the top');
	});

	QUnit.test('sort key is exposed and can be updated', function(assert) {
		var source = ko.observableArray([
			{ id: 4, name: 'C' },
			{ id: 1, name: 'B' },
			{ id: 2, name: 'A' }
		]).extend({
			sortable: {
				key: 'id'
			}
		});

		assert.equal(source.sortKey(), 'id', 'The sort key should be exposed');

		source.sortKey('name');

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			2, 1, 4
		], 'should have sorted by name');
	});

	QUnit.test('can sort by property path', function(assert) {
		var source = ko.observableArray([
			{ id: 4, nested: { id: 3 } },
			{ id: 1, nested: { id: 2 } },
			{ id: 2, nested: { id: 1 } }
		]).extend({
			sortable: {
				key: 'nested.id'
			}
		});

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			2, 1, 4
		], 'should have sorted by the nested id');

		source.push({ id: 3, nested: { id: 5 } });

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			2, 1, 4, 3
		], 'should have sorted by the nested id');
	});

	QUnit.test('can sort by observable properties', function(assert) {
		var source = ko.observableArray([
			{ id: 4, nested: ko.observable({ id: ko.observable(3) }) },
			{ id: 1, nested: ko.observable({ id: ko.observable(2) }) },
			{ id: 2, nested: ko.observable({ id: ko.observable(1) }) }
		]).extend({
			sortable: {
				key: 'nested.id'
			}
		});

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			2, 1, 4
		], 'should have sorted by the nested id');

		source.push({ id: 3, nested: { id: 5 } });

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			2, 1, 4, 3
		], 'should have sorted by the nested id');
	});

	QUnit.test('updates sort when observable properties change', function(assert) {
		var source = ko.observableArray([
			{ id: 4, property: ko.observable(4) },
			{ id: 1, property: ko.observable(1) },
			{ id: 2, property: ko.observable(2) }
		]).extend({
			sortable: {
				key: 'property'
			}
		});

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			1, 2, 4
		], 'should have sorted by the property');

		source()[2].property(-1);

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			4, 1, 2
		], 'sort should have been updated');
	});

	QUnit.test('can sort on observable array lengths', function(assert) {
		var source = ko.observableArray([
			{ id: 4, property: ko.observableArray([1,1,1,1]) },
			{ id: 1, property: ko.observableArray([1]) },
			{ id: 2, property: ko.observableArray([1,1]) }
		]).extend({
			sortable: {
				key: 'property.length'
			}
		});

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			1, 2, 4
		], 'should have sorted by the property');
	});

	QUnit.test('sortDescending is exposed and can be changed', function(assert) {
		var source = ko.observableArray([
			{ id: 4 },
			{ id: 1 },
			{ id: 2 }
		]).extend({
			sortable: {
				key: 'id',
				descending: true
			}
		});

		assert.equal(source.sortKey(), 'id', 'The sort key should be exposed');
		assert.ok(source.sortDescending(), 'Descending should have been taken from the options');

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			4, 2, 1
		], 'should have sorted in reverse order');

		source.sortDescending(false);

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			1, 2, 4
		], 'should have sorted in order');
	});

	QUnit.test('null items are sorted to the top', function(assert) {
		var source = ko.observableArray([
			{ id: 4 },
			{ id: 1 },
			null,
			{ id: 2 },
			null
		]).extend({
			sortable: {
				key: 'id'
			}
		});

		assert.equal(source()[0], null, 'null items should appear at the top');
		assert.equal(source()[1], null, 'null items should appear at the top');

		source.sortDescending(true);

		assert.equal(source()[3], null, 'null items should appear at the end');
		assert.equal(source()[4], null, 'null items should appear at the end');
	});

	QUnit.test('setSortKey sets the sort key and reverses if it matches', function(assert) {
		var source = ko.observableArray([
			{ id: 4, name: 'C' },
			{ id: 1, name: 'B' },
			{ id: 2, name: 'A' }
		]).extend({ sortable: true });

		source.setSortKey('id');
		assert.equal(source.sortKey(), 'id', 'The sortKey should have been set');
		assert.ok(!source.sortDescending(), 'Descending should be false');

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			1, 2, 4
		], 'should have sorted by the specified sort key');

		source.setSortKey('id');
		assert.equal(source.sortKey(), 'id', 'The sortKey should have been set');
		assert.ok(source.sortDescending(), 'Descending should be true');

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			4, 2, 1
		], 'should have sorted by the specified sort key');

		source.setSortKey('name');
		assert.equal(source.sortKey(), 'name', 'The sortKey should have been set');
		assert.ok(!source.sortDescending(), 'Descending should be false again as the key has changed');

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			2, 1, 4
		], 'should have sorted by the specified sort key');
	});
	
	QUnit.test('can sort on strings', function(assert) {
		var source = ko.observableArray([
			'aa',
			'ba',
			'b',
			'ab',
			'a'
		]).extend({ sortable: true });

		assert.deepEqual(source(), [
			'a',
			'aa',
			'ab',
			'b',
			'ba'
		], 'Strings should be sorted correctly');
	});

	QUnit.test('can sort on strings ignoring case', function (assert) {
		var source = ko.observableArray([
			'AA',
			'ba',
			'b',
			'AB',
			'a'
		]).extend({ sortable: true });

		assert.deepEqual(source(), [
			'a',
			'AA',
			'AB',
			'b',
			'ba'
		], 'Strings should be sorted correctly');
	});

	QUnit.test('can sort on strings with locale', function (assert) {
		var source = ko.observableArray([
			'å',
			'a',
			'æ',
			'ba',
			'ø'
		]).extend({ sortable: { locale: 'nb' } });

		assert.deepEqual(source(), [
			'a',
			'ba',
			'æ',
			'ø',
			'å'
		], 'Strings should be sorted correctly');
	});

	QUnit.test('can sort on strings with locale descending', function (assert) {
		var source = ko.observableArray([
			'å',
			'æ',
			'a',
			'øy',
			'ad'
		]).extend({ sortable: { locale: 'nb', descending: true } });

		assert.deepEqual(source(), [
			'å',
			'øy',
			'æ',
			'ad',
			'a'
		], 'Strings should be sorted correctly');
	});

	QUnit.test('can sort on strings with locale ignoring case', function (assert) {
		var source = ko.observableArray([
			'a',
			'Ø',
			'æ',
			'å',
			'A'
		]).extend({ sortable: { locale: 'nb' } });

		assert.deepEqual(source(), [
			'a',
			'A',
			'æ',
			'Ø',
			'å'
		], 'Strings should be sorted correctly');
	});

	QUnit.test('treats null nested properties as null', function(assert) {
		var source = ko.observableArray([
			{ id: 4 },
			{ id: 1, nested: { name: '..' } },
			{ id: 2, nested: { name: '.' } },
			{ id: 3, nested: { } }
		]).extend({
			sortable: {
				key: 'nested.name.length'
			}
		});

		assert.deepEqual(source().map(function(s) { return s.id; }), [
			4, 3, 2, 1
		], 'should have sorted by the nested id');
	});

	QUnit.test('undefined values are sorted to the bottom', function (assert) {
		var source = ko.observableArray([, '4', '1', '5', , '7', '3']).extend({ sortable: true });

		assert.deepEqual(source(), ['1', '3', '4', '5', '7', undefined, undefined]);

		source.sortDescending(true);

		assert.deepEqual(source(), ['7', '5', '4', '3', '1', undefined, undefined]);
	});

	QUnit.test('null nested values are sorted to the bottom when sortNullsToBottom is specified', function (assert) {
		var source = ko.observableArray([
		{ id: 3, nested: { name: 'bcd' } },
		{ id: 1, nested: { name: 'abc' } },
		{ id: 6 },
		{ id: 2, nested: { } },
		{ id: 5, nested: { name: '123' } }
		]).extend({ sortable: { key: 'nested.name', sortNullsToBottom: true }  });

		assert.deepEqual(source().map(function(s) { return s.id; }), [5, 1, 3, 6, 2]);
        
		source.sortDescending(true);

		assert.deepEqual(source().map(function(s) { return s.id; }), [3, 1, 5, 6, 2]);
	});

	QUnit.test('can sort by multiple keys', function (assert) {
		var source = ko.observableArray([
			{ id: 4, nested: { value: 1 } },
			{ id: 3, nested: { name: 'bcd' } },
			{ id: 1, nested: { name: 'abc', value: 2 } },
			{ id: 6 },
			{ id: 5, nested: { name: 'abc', value: 1 } },
			{ id: 2, nested: { name: 'abc' } }
		]).extend({ sortable: { key: 'nested.name, nested.value' } });

		assert.deepEqual(source().map(function (s) { return s.id; }), [6, 4, 2, 5, 1, 3]);

		source.sortDescending(true);

		assert.deepEqual(source().map(function (s) { return s.id; }), [3, 1, 5, 2, 4, 6]);
	});

	QUnit.test('can sort by multiple keys with nulls at bottom', function (assert) {
		var source = ko.observableArray([
			{ id: 4, nested: { value: 1 } },
			{ id: 3, nested: { name: 'bcd' } },
			{ id: 1, nested: { name: 'abc', value: 2 } },
			{ id: 6 },
			{ id: 5, nested: { name: 'abc', value: 1 } },
			{ id: 2, nested: { name: 'abc' } }
		]).extend({ sortable: { key: 'nested.name, nested.value', sortNullsToBottom: true } });

		assert.deepEqual(source().map(function (s) { return s.id; }), [5, 1, 2, 3, 4, 6]);

		source.sortDescending(true);

		assert.deepEqual(source().map(function (s) { return s.id; }), [3, 1, 5, 2, 4, 6]);
	});

});