(function (window, undefined) {
    "use strict";
    (function (factory) {
        if (typeof define === "function" && define.amd) { // AMD
            define("ko.plus", ["jquery", "knockout"], factory);
        }
        else {
            factory(window.jQuery, window.ko);
        }
    }(function ($, ko) {
	"use strict";