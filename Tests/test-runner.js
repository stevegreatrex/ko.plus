/*global require: false, QUnit: false */

(function () {
    "use strict";

    require.config({
        baseUrl: "/src",
        shim: {
            "sinon": { exports: "sinon" },
        },
        paths: {
            "jquery": "../Scripts/jquery-2.0.3",
            "knockout": "../Scripts/knockout-2.3.0",
            "sinon": "../Scripts/sinon-1.7.3.js"
        },
        deps: [
            "ko.loadingWhen"
        ],

        waitSeconds: 0
    });

    QUnit.config.autostart = false;

    require([
       "../tests/ko.command.tests",
       "../tests/ko.editable.tests"
    ], QUnit.start);

}());