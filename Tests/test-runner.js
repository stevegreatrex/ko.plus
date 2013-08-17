/*global require: false, QUnit: false */

(function () {
    "use strict";

    require.config({
        waitSeconds: 0
    });

    QUnit.config.autostart = false;

    require([
       "ko.command.tests",
       "ko.editable.tests"
    ], QUnit.start);

}());