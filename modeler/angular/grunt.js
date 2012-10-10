/*global module:false*/
module.exports = function(grunt) {
	'use strict';
	grunt.initConfig({
		pkg: '<json:package.json>',
		meta: {
			banner: '// <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
				'<%= pkg.homepage ? "// " + pkg.homepage + "\n" : "" %>' +
				'// Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
				' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>'
		},
		clean: {
			app: {
				src: ["dist", "docs", "app/js", 'test/unit/js']
			}
		},
		docco: {
			app: {
				src: ['**/*.ls', '**/*.js']
			}
		},
		qunit: {
			files: ['test/**/*.html']
		},
		livescript: {
			app: {
				files: {
					'app/scripts/js/app.js': 'app/scripts/ls/app.ls',
					'app/scripts/js/filters.js': 'app/scripts/ls/filters/*ls',
					'app/scripts/js/services.js': 'app/scripts/ls/services/*ls',
					'app/scripts/js/directives.js': 'app/scripts/ls/directives/*ls',
					'app/scripts/js/controllers.js': 'app/scripts/ls/controllers/*ls'
				},
				options: {
					bare: false
				}
			},
			dist: {
				files: {
					'app/dist/modeler.js': 'app/dist/modeler.ls'
				}
			},
			test: {
				files: {
					'test/unit/js/unit.js': 'test/unit/**/*.ls',

					'test/e2e/js/spec.js': 'test/e2e/ls/*.ls'
				},
				options: {
					bare: true
				}
			}
		},
		stylus: {
			app: {
				files: {
					'app/styles/css/modeler.css': 'app/styles/styl/*styl'
				}
			}
		},
		concat: {
			app: {
				src: [
					'app/scripts/ls/app.ls',
					'app/scripts/ls/**/*ls',
				],
				dest: 'app/dist/modeler.ls'
			},
			unit: {
				src: ['test/unit/js/*'],
				dest: 'test/unit.js'
			},
			e2e: {
				src: ['test/e2e/js/*'],
				dest: 'test/e2e.js'	
			}
		},
		min: {
			dist: {
				src: ['<banner:meta.banner>', 'app/dist/modeler.js'],
				dest: 'app/dist/modeler.min.js'
			}
		},
		mincss: {
			dist: {
				files: {
					'app/dist/modeler.min.css': ['app/styles/css/modeler.css']
				}
			}
		},
		watch: {
			app: {
				files: ["app/scripts/ls/**/*ls", "app/views/**", "app/index.html", "test/**/*ls", "app/styles/styl/**/*styl"],
				tasks: ["default"]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib');
	grunt.loadNpmTasks('grunt-docco');
	grunt.loadNpmTasks('grunt-contrib-livescript');

	grunt.registerTask('styles', 'stylus:app mincss:dist');
	grunt.registerTask('app', 'livescript:app concat:app livescript:dist styles min');
	grunt.registerTask('tests', 'livescript:test concat:unit concat:e2e');
	grunt.registerTask('default', 'clean app tests');
};
