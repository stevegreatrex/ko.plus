/*global ko: false, module: false, test: false, raises: false, equal: false, ok: false, deepEqual: false*/

(function ($, ko, undefined) {
	'use strict';

	module('ko.sortable Tests');

	test('defaults to basic sort', function() {
		var source = ko.observableArray([2,3,1]);
		var sorted = source.extend({ sortable: true });

		deepEqual(sorted(), [1,2,3], 'Should have been sorted by default');
	});

	test('sorted list updates when parent list changes', function() {
		var source = ko.observableArray([2,3,1]);
		var sorted = source.extend({ sortable: true });

		source.push(-3);

		deepEqual(sorted(), [-3,1,2,3], 'Should have been updated');
	});

	test('can sort by property name', function() {
		var source = ko.observableArray([
			{ id: 4 },
			{ id: 1 },
			{ id: 2 }
		]).extend({
				sortable: {
					key: 'id'
			}
		});

		deepEqual(source().map(function(s) { return s.id; }), [
			1, 2, 4
		], 'should have sorted by id');

		source.push({ id: 3 });

		deepEqual(source().map(function(s) { return s.id; }), [
			1, 2, 3, 4
		], 'should have sorted by id');
	});

	test('sorts null string keys to top', function() {
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

		deepEqual(source().map(function(s) { return s.id; }), [
			null, null, 'a', 'b'
		], 'should have sorted null values to the top');
	});

	test('sort key is exposed and can be updated', function() {
		var source = ko.observableArray([
			{ id: 4, name: 'C' },
			{ id: 1, name: 'B' },
			{ id: 2, name: 'A' }
		]).extend({
			sortable: {
				key: 'id'
			}
		});

		equal(source.sortKey(), 'id', 'The sort key should be exposed');

		source.sortKey('name');

		deepEqual(source().map(function(s) { return s.id; }), [
			2, 1, 4
		], 'should have sorted by name');
	});

	test('can sort by property path', function() {
		var source = ko.observableArray([
			{ id: 4, nested: { id: 3 } },
			{ id: 1, nested: { id: 2 } },
			{ id: 2, nested: { id: 1 } }
		]).extend({
			sortable: {
				key: 'nested.id'
			}
		});

		deepEqual(source().map(function(s) { return s.id; }), [
			2, 1, 4
		], 'should have sorted by the nested id');

		source.push({ id: 3, nested: { id: 5 } });

		deepEqual(source().map(function(s) { return s.id; }), [
			2, 1, 4, 3
		], 'should have sorted by the nested id');
	});

	test('can sort by observable properties', function() {
		var source = ko.observableArray([
			{ id: 4, nested: ko.observable({ id: ko.observable(3) }) },
			{ id: 1, nested: ko.observable({ id: ko.observable(2) }) },
			{ id: 2, nested: ko.observable({ id: ko.observable(1) }) }
		]).extend({
			sortable: {
				key: 'nested.id'
			}
		});

		deepEqual(source().map(function(s) { return s.id; }), [
			2, 1, 4
		], 'should have sorted by the nested id');

		source.push({ id: 3, nested: { id: 5 } });

		deepEqual(source().map(function(s) { return s.id; }), [
			2, 1, 4, 3
		], 'should have sorted by the nested id');
	});

	test('updates sort when observable properties change', function() {
		var source = ko.observableArray([
			{ id: 4, property: ko.observable(4) },
			{ id: 1, property: ko.observable(1) },
			{ id: 2, property: ko.observable(2) }
		]).extend({
			sortable: {
				key: 'property'
			}
		});

		deepEqual(source().map(function(s) { return s.id; }), [
			1, 2, 4
		], 'should have sorted by the property');

		source()[2].property(-1);

		deepEqual(source().map(function(s) { return s.id; }), [
			4, 1, 2
		], 'sort should have been updated');
	});

	test('can sort on observable array lengths', function() {
		var source = ko.observableArray([
			{ id: 4, property: ko.observableArray([1,1,1,1]) },
			{ id: 1, property: ko.observableArray([1]) },
			{ id: 2, property: ko.observableArray([1,1]) }
		]).extend({
			sortable: {
				key: 'property.length'
			}
		});

		deepEqual(source().map(function(s) { return s.id; }), [
			1, 2, 4
		], 'should have sorted by the property');
	});

	test('sortDescending is exposed and can be changed', function() {
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

		equal(source.sortKey(), 'id', 'The sort key should be exposed');
		ok(source.sortDescending(), 'Descending should have been taken from the options');

		deepEqual(source().map(function(s) { return s.id; }), [
			4, 2, 1
		], 'should have sorted in reverse order');

		source.sortDescending(false);

		deepEqual(source().map(function(s) { return s.id; }), [
			1, 2, 4
		], 'should have sorted in order');
	});

	test('null items are sorted to the top', function() {
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

		equal(source()[0], null, 'null items should appear at the top');
		equal(source()[1], null, 'null items should appear at the top');

		source.sortDescending(true);

		equal(source()[3], null, 'null items should appear at the end');
		equal(source()[4], null, 'null items should appear at the end');
	});

	test('setSortKey sets the sort key and reverses if it matches', function() {
		var source = ko.observableArray([
			{ id: 4, name: 'C' },
			{ id: 1, name: 'B' },
			{ id: 2, name: 'A' }
		]).extend({ sortable: true });

		source.setSortKey('id');
		equal(source.sortKey(), 'id', 'The sortKey should have been set');
		ok(!source.sortDescending(), 'Descending should be false');

		deepEqual(source().map(function(s) { return s.id; }), [
			1, 2, 4
		], 'should have sorted by the specified sort key');

		source.setSortKey('id');
		equal(source.sortKey(), 'id', 'The sortKey should have been set');
		ok(source.sortDescending(), 'Descending should be true');

		deepEqual(source().map(function(s) { return s.id; }), [
			4, 2, 1
		], 'should have sorted by the specified sort key');

		source.setSortKey('name');
		equal(source.sortKey(), 'name', 'The sortKey should have been set');
		ok(!source.sortDescending(), 'Descending should be false again as the key has changed');

		deepEqual(source().map(function(s) { return s.id; }), [
			2, 1, 4
		], 'should have sorted by the specified sort key');
	});
	
	test('can sort on strings', function() {
		var source = ko.observableArray([
			'aa',
			'ba',
			'b',
			'ab',
			'a'
		]).extend({ sortable: true });

		deepEqual(source(), [
			'a',
			'aa',
			'ab',
			'b',
			'ba'
		], 'Strings should be sorted correctly');
	});

	test('can sort on strings ignoring case', function () {
		var source = ko.observableArray([
			'AA',
			'ba',
			'b',
			'AB',
			'a'
		]).extend({ sortable: true });

		deepEqual(source(), [
			'a',
			'AA',
			'AB',
			'b',
			'ba'
		], 'Strings should be sorted correctly');
	});

	test('treats null nested properties as null', function() {
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

		deepEqual(source().map(function(s) { return s.id; }), [
			4, 3, 2, 1
		], 'should have sorted by the nested id');
	});

	test('undefined values are sorted to the bottom', function () {
        var source = ko.observableArray([, '4', '1', '5', , '7', '3']).extend({ sortable: true });

        deepEqual(source(), ['1', '3', '4', '5', '7', undefined, undefined]);

        source.sortDescending(true);

        deepEqual(source(), ['7', '5', '4', '3', '1', undefined, undefined]);
    });

	test('null nested values are sorted to the bottom when sortNullsToBottom is specified', function () {
        var source = ko.observableArray([
        { id: 3, nested: { name: 'bcd' } },
        { id: 1, nested: { name: 'abc' } },
        { id: 6 },
        { id: 2, nested: { } },
        { id: 5, nested: { name: '123' } }
        ]).extend({ sortable: { key: 'nested.name', sortNullsToBottom: true }  });

        deepEqual(source().map(function(s) { return s.id; }), [5, 1, 3, 6, 2]);
        
        source.sortDescending(true);

        deepEqual(source().map(function(s) { return s.id; }), [3, 1, 5, 6, 2]);
    });

}(jQuery, ko));