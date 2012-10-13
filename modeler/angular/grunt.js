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
				src: ["build", "docs", "app/views/templates.html", 'test/unit/js']
			}
		},
		jade: {
			templates: {
				files: {
					'app/views/templates.html': ['app/components/**/*jade']
				}
			},
			page: {
				files: {
					'build/index.html': 'app/views/page/index.jade'
				}
			}
		},
		livescript: {
			app: {
				files: {
					'build/scripts/app.js': 'app/scripts/ls/app.ls',
					'build/scripts/filters.js': 'app/scripts/ls/filters/*ls',
					'build/scripts/services.js': 'app/scripts/ls/services/*ls',
					'build/scripts/directives.js': 'app/scripts/ls/directives/*ls',
					'build/scripts/controllers.js': 'app/scripts/ls/controllers/*ls',
					'build/scripts/components.js': 'app/components/**/*ls'
				},
				options: {
					bare: false
				}
			},
			dist: {
				files: {
					'build/dist/<%= pkg.name %>.js': 'build/dist/<%= pkg.name %>.ls'
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
					'build/styles/<%= pkg.name %>.css': ['app/styles/styl/*styl', 'app/components/**/*styl']
				}
			}
		},
		concat: {
			ls: {
				src: [
					'app/scripts/ls/app.ls',
					'app/scripts/ls/**/*ls',
					'app/components/**/*ls'
				],
				dest: 'build/dist/<%= pkg.name %>.ls'
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
		copy: {
			app: {
				files: {
					'build/scripts/lib/': 'app/scripts/lib/**',
					'build/styles/lib/': 'app/styles/lib/**',
					'build/images/': 'app/images/**',
					'build/entityContext.json': 'app/entityContext.json'
				}
			}
		},
		min: {
			dist: {
				src: ['<banner:meta.banner>', 'build/dist/<%= pkg.name %>.js'],
				dest: 'build/dist/<%= pkg.name %>.min.js'
			}
		},
		mincss: {
			dist: {
				files: {
					'build/dist/<%= pkg.name %>.min.css': ['build/styles/<%= pkg.name %>.css']
				}
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
		watch: {
			app: {
				files: ["app/scripts/ls/**/*ls", "app/views/**", "test/**/*ls", "app/styles/styl/**/*styl", "app/components/**/*"],
				tasks: ["default"]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib');
	grunt.loadNpmTasks('grunt-docco');
	grunt.loadNpmTasks('grunt-contrib-livescript');

	grunt.registerTask('views', 'jade:templates jade:page');
	grunt.registerTask('scripts', 'livescript:app concat:ls livescript:dist');
	grunt.registerTask('styles', 'stylus:app mincss:dist');
	grunt.registerTask('app', 'views scripts styles copy min');
	grunt.registerTask('tests', 'livescript:test concat:unit concat:e2e');
	grunt.registerTask('default', 'clean app tests');
};
