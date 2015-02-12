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
				if (ko.isObservable(target[index])) {
					subscriptions.push(target[index].subscribe(sortList));
				}
				return ko.unwrap(target[index]);
			}

			return path.split('.').reduce(unwrap, object);
		}

		function sortFunction(a, b) {
			var descending = target.sortDescending();

			if (a === null) { return b === null ? 0 : descending ? 1 : -1; }
			if (b === null) { return descending ? -1 : 1; }
			
			var aValue = target.sortKey() ? unwrapPath(a, target.sortKey()) : a;
			var bValue = target.sortKey() ? unwrapPath(b, target.sortKey()) : b;

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
}(jQuery, ko));
