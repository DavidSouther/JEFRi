module.exports = function(grunt) {
	'use strict';
	grunt.initConfig({
		pkg: '<json:package.json>',
		meta: {
			banner: '/* <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
				'<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
				'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
				' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
		},
		clean: {
			app: {
				src: ["build", "docs", 'test/unit/js']
			}
		},
		livescript: {
			dist: {
				files: {
					'build/dist/<%= pkg.name %>.js': 'build/dist/<%= pkg.name %>.ls'
				}
			},
			test: {
				files: {
					'test/unit/js/components.js': ['app/components/**/test*ls'],
					'test/e2e/e2e.js': 'test/e2e/ls/**/*ls'
				},
				options: {
					bare: true
				}
			}
		},
		concat: {
			ls: {
				src: [
					'client/module.ls',
					'client/services/*ls',
					'client/directives/*ls'
				],
				dest: 'build/dist/<%= pkg.name %>.ls'
			},
			unit: {
				src: ['test/unit/js/*'],
				dest: 'test/unit.js'
			}
		},
		min: {
			dist: {
				src: ['<banner:meta.banner>', 'build/dist/<%= pkg.name %>.js'],
				dest: 'build/dist/<%= pkg.name %>.min.js'
			}
		},
		qunit: {
			files: ['test/qunit/**/*.html']
		},
		watch: {
			app: {
				files: [
					"app/scripts/ls/**/*ls",
					"app/views/**/*",
					"test/**/*ls",
					"app/styles/styl/**/*",
					"app/components/**/*"
				],
				tasks: ["default"]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib');
	grunt.loadNpmTasks('grunt-livescript');

	grunt.registerTask('views', 'jade:templates jade:pages jade:page');
	grunt.registerTask('scripts', 'concat:ls livescript:dist');
	grunt.registerTask('app', 'scripts min');
	grunt.registerTask('tests', 'livescript:test concat:unit');
	grunt.registerTask('default', 'clean app tests');
};
