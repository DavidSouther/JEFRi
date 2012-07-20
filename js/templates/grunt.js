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
		clean: {
			app: {
				src: ["dist", "docs"]
			}
		},
		lint: {
			files: ['grunt.js', 'src/**/*.js', 'test/**/*.js']
		},
		coffee: {
			app: {
				files: {
					'dist/coffee/template.js': 'src/template.coffee'
				}
			}
		},
		less: {
			app: {
				files: {
					'dist/less/template.css': 'src/template.less'
				}
			}
		},
		docco: {
			app: {
				src: ['**/*.coffee', '**/*.js']
			}
		},
		concat: {
			dist: {
				src: ['<banner:meta.banner>', 'src/**/*.js', 'dist/coffee/**/*.js'],
				dest: 'dist/<%= pkg.name %>.js'
			},
			css: {
				src: ['<banner:meta.banner>', 'src/**/*.css', 'dist/less/**/*.js'],
				dest: 'dist/<%= pkg.name %>.css'
			}
		},
		min: {
			dist: {
				src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
				dest: 'dist/<%= pkg.name %>.min.js'
			}
		},
		qunit: {
			files: ['test/**/*.html']
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

	grunt.registerTask('default', 'clean lint less coffee concat concat:css min');
};
