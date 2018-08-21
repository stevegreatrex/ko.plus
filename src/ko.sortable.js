/*global jQuery:false, ko:false*/

(function ($, ko, undefined) {
	'use strict';

	ko.extenders.sortable = function(target, options) {
		if (typeof options !== 'object') {
			options = {};
		}

		var localeCollator;
		if(options && options.locale){
			localeCollator = new Intl.Collator(options.locale, { sensitivity: 'base' });
		}

		var subscriptions = [];

		function unwrapPath(object, path) {
			function unwrap(target, index) {
				if (!target) { return null; }

				if (ko.isObservable(target[index])) {
					subscriptions.push(target[index].subscribe(sortList));
				}
				return ko.unwrap(target[index]);
			}

			return path.split('.').reduce(unwrap, object);
		}

		function sortFunction(a, b) {
			var descending = target.sortDescending();

			var sortKeys = (target.sortKey() || '').split(',');
			
			var result = 0;
			sortKeys.forEach(function (key) {
				result = result || sortByKey(a, b, key.trim(), descending);
			});

			return result;
		}

		function sortByKey(a, b, key, descending) {
			var aValue = key ? unwrapPath(a, key) : a;
			var bValue = key ? unwrapPath(b, key) : b;

			if (aValue === null || aValue === undefined) { return bValue === null || bValue === undefined ? 0 : options.sortNullsToBottom || descending ? 1 : -1; }
			if (bValue === null || bValue === undefined) { return options.sortNullsToBottom || descending ? -1 : 1; }

			if (typeof aValue === 'string') { aValue = aValue.toLowerCase(); }
			if (typeof bValue === 'string') { bValue = bValue.toLowerCase(); }

			if (localeCollator && typeof aValue === 'string' && typeof bValue === 'string') { return descending ? localeCollator.compare(bValue, aValue) : localeCollator.compare(aValue, bValue); }

			if (aValue < bValue) { return descending ? 1 : -1; }
			if (aValue > bValue) { return descending ? -1 : 1; }

			return 0;
			
		}

		target.sortKey        = ko.observable(options.key);
		target.sortDescending = ko.observable(!!options.descending);

		/**
		 * Sets the sortKey to the specified key value and reverses the sort
		 * direction if that sort key is already the current one.
		 * @param key
		 */
		target.setSortKey = function(key) {
			if (key === target.sortKey()) {
				target.sortDescending(!target.sortDescending());
			} else {
				target.sortKey(key);
				target.sortDescending(false);
			}
		};

		target.sort(sortFunction);

		var sorting;

		function sortList() {
			if (sorting) { return; }

			subscriptions.forEach(function(s) {s.dispose(); });
			subscriptions = [];

			sorting = true;
			target.sort(sortFunction);
			sorting = false;
		}

		target.subscribe(sortList);
		target.sortKey.subscribe(sortList);
		target.sortDescending.subscribe(sortList);

		return target;
	};

	/**
	 * Adds a sort caret to a header element and binds to the setSortKey property
	 * for the specified source collection.
	 */
	ko.bindingHandlers.sortBy = {
		init: function(element, valueAccessor) {

			var options = ko.unwrap(valueAccessor());
			if (!options) { return; }

			var source = options.source;
			var key    = ko.unwrap(options.key);

			if (!source || !key || !source.sortKey) { return; }

			var $sortCaret = $("<span>").addClass('sort-caret');

			function updateCaret() {
				$sortCaret.css('display', source.sortKey() === key ? 'inline-block' : 'none');
				if (source.sortDescending()) {
					$sortCaret.css({ transform: 'rotate(0)' });
				} else {
					$sortCaret.css({ transform: 'rotate(180deg)' });
				}
			}

			$(element)
				.css({ position: 'relative' })
				.append($sortCaret)
				.click(function() {
					source.setSortKey(key);
					updateCaret();
				});

			source.sortKey.subscribe(updateCaret);
			source.sortDescending.subscribe(updateCaret);
			updateCaret();
		}
	};

}($, ko));
