/*global jQuery:false, ko:false*/

(function ($, ko) {
	'use strict';

	ko.extenders.sortable = function(target, options) {
		if (typeof options !== 'object') {
			options = {};
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

			var aValue = target.sortKey() ? unwrapPath(a, target.sortKey()) : a;
			var bValue = target.sortKey() ? unwrapPath(b, target.sortKey()) : b;

			if (aValue === null) { return bValue === null ? 0 : descending ? 1 : -1; }
			if (bValue === null) { return descending ? -1 : 1; }

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

}(jQuery, ko));
