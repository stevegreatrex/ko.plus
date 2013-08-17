/*global require: false, QUnit: false */

(function () {
    "use strict";

    require.config({
        waitSeconds: 0
    });

    require([
       "ko.command.tests",
       "ko.editable.tests"
    ], QUnit.start);

}());