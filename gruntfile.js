/*global module:false*/
module.exports = function (grunt) {
    "use strict";
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        meta: {
            banner: "/*=============================================================================\n" +
                    " *   Author:      Steve Greatrex - @stevegreatrex                               \n" +
                    " *                                                                              \n" +
                    " *   Description: Awesome extensions for KnockoutJs                              \n" +
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
            },
            css: {
				src: [
					"<%= meta.banner %>",
					"css/*.css",
				],
				dest: "dist/<%= pkg.name %>.css"
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
            files: ["Tests/**/*.html"]
        },
        jshint: {
        	files: ["src/**/*.js", "Tests/**/*.js", "!Tests/qunit*.js"],
            options: {
                globals: {
                    jQuery: true,
                    ko: true,
                }
            }
        },
        watch: {
        	clear: {
        		files: ["src/**/*.js", "Tests/**/*.js"],
				tasks: ["clear", "test"]
        	}
        }
    });

    grunt.registerTask("nuget", "create nuget package", function () {
        var done = this.async();
        grunt.util.spawn({
            cmd: "nuget\\nuget",
            args: [
                "pack",
                "nuget\\ko.plus.nuspec",

                "-OutputDirectory",
                "dist",

                "-Version",
                grunt.config.get("pkg").version
            ]
        }, function (error, result) {
            if (error) {
                grunt.log.error(error);
            } else {
                grunt.log.write(result);
            }
            done();
        });
    });

    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-qunit");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-clear");

    grunt.registerTask("test", ["qunit", "jshint"]);
    grunt.registerTask("default", ["qunit", "jshint", "concat", "uglify", "nuget"]);

};