/*global module:false*/
module.exports = function (grunt) {
    "use strict";
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        meta: {
            version: "0.1.0",
            banner: "/*=============================================================================\n" +
                    " *   Author:      Steve Greatrex - @stevegreatrex                               \n" +
                    " *                                                                              \n" +
                    " *   Description: Helper extensions for KnockoutJs                              \n" +
                    " *=============================================================================*/\n\n"
        },
        concat: {
            options: {
                separator: ";",
                banner: "<%= meta.banner %>"
            },
            dist: {
                src: [
                    "<%= meta.banner %>",
                    "src/ko.plus.start.frag",
                    "src/ko.command.js",
                    "src/ko.editable.js",
                    "src/ko.loadingWhen.js",
                    "src/ko.plus.end.frag",
                ],
                dest: "dist/<%= pkg.name %>.js"
            }
        },
        uglify: {
            options: {
                banner: "<%= meta.banner %>"
            },
            dist: {
                files: {
                    "dist/<%= pkg.name %>.min.js": ["<%= concat.dist.dest %>"]
                }
            }
        },
        qunit: {
            files: ["tests/**/*.html"]
        },
        jshint: {
            files: ["src/**/*.js", "test/**/*.js"],
            options: {
                globals: {
                    jQuery: true,
                    ko: true,
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-qunit");
    grunt.loadNpmTasks("grunt-contrib-concat");

    grunt.registerTask("test", ["jshint", "qunit"]);

    grunt.registerTask("default", ["jshint", "concat", "uglify"]);

};