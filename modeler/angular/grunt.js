/*global module:false*/
module.exports = function(grunt) {
	grunt.initConfig({
		pkg: '<json:package.json>',
		meta: {
			banner: '// <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
				'<%= pkg.homepage ? "// " + pkg.homepage + "\n" : "" %>' +
				'// Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
				' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>'
		},
		lint: {
			files: ['grunt.js', 'src/**/*.js', 'test/**/*.js']
		},
		clean: {
			app: {
				src: ["app/dist", "docs", "app/js"]
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
					'app/js/app.js': 'app/ls/app.ls',

					'app/js/services/jquery.js': 'app/ls/services/jquery.ls',
					'app/js/services/jefri.js': 'app/ls/services/jefri.ls',
					'app/js/services/model.js': 'app/ls/services/model.ls',

					'app/js/controllers/entity.js': 'app/ls/controllers/entity.ls',
					'app/js/controllers/context.js': 'app/ls/controllers/context.ls',

					'app/js/directives/entity.js': 'app/ls/directives/entity.ls',
				},
				options: {
					bare: false
				}
			},
			dist: {
				files: {
					'app/dist/modeler.js': 'app/dist/modeler.ls'
				}
			}
		},
		concat: {
			dist: {
				src: [
					'app/ls/app.ls',
					'app/ls/services/*ls',
					'app/ls/controllers/*ls',
					'app/ls/directives/*ls',
				],
				dest: 'app/dist/modeler.ls'
			}
		},
		min: {
			dist: {
				src: ['<banner:meta.banner>', 'app/dist/modeler.js'],
				dest: 'app/dist/modeler.min.js'
			}
		},
		watch: {
		},
		jshint: {
			options: {
				curly: true,
				eqeqeq: true,
				immed: true,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				boss: true,
				eqnull: true
			},
			globals: {
				jQuery:false,
				JEFRi:false,
				UUID: false,
				_:false
			}
		},
		uglify: {}
	});

	grunt.loadNpmTasks('grunt-contrib');
	grunt.loadNpmTasks('grunt-docco');

	grunt.registerTask('default', 'clean livescript:app concat:dist livescript:dist min');
};
