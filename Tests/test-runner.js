/*global require: false, QUnit: false */

(function () {
	'use strict';

	require.config({
		paths: {
			'qunit': './qunit-2.6.1'
		},
		waitSeconds: 0
	});


	require([
		'qunit', 
		'ko.command.tests', 
		'ko.editable.tests', 
		'ko.sortable.tests'
	], function (QUnit, commandtests, editabletests, sortabletests) {
		QUnit.config.autostart = false;
		QUnit.start();
	});

}());