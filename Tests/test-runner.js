/*global require: false, QUnit: false */

(function () {
    "use strict";

    require.config({
        baseUrl: "/dist",
        paths: {
            "jquery": "../Scripts/jquery-2.0.3",
            "knockout": "../Scripts/knockout-2.3.0",
        },
        deps: [
            "ko.plus"
        ],

        waitSeconds: 0
    });

    QUnit.config.autostart = false;

    require([
       "../tests/ko.command.tests",
       "../tests/ko.editable.tests"
    ], QUnit.start);

}());