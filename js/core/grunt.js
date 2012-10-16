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
				src: ["dist", "docs"]
			}
		},
		docco: {
			app: {
				src: ['**/*.ls', '**/*.js']
			}
		},
		qunit: {
			files: ['test/qunit/*.html']
		},
		jasmine_node: {
			specFolderName: "spec",
			projectRoot: "./test/",
			requirejs: false,
			forceExit: true,
			jUnit: {
				report: false,
				savePath : "./test/spec/reports/",
				useDotNotation: true,
				consolidate: true
			}
		},
		livescript: {
			app: {
				files: {
					"dist/compiled/Runtime.js": 'src/Runtime.ls',
					"dist/compiled/Transaction.js": 'src/Transaction.ls',
					"dist/compiled/Stores.js": ['src/*Store.ls']
				}
			},
			qunit: {
				files: {
					"test/qunit/livescripttests.js": ["test/qunit/livescript/*ls"]
				}
			},
			jasmine: {
				files: {
					"test/spec/livescript.spec.js": ["test/spec/livescript/**/*ls"]
				},
				options: {
					bare: true
				}
			}
		},
		concat: {
			dist: {
				src: ['<banner:meta.banner>', 'src/uuid.js', 'dist/compiled/Runtime.js', 'dist/compiled/Transaction.js', 'src/PostStore.js', 'dist/compiled/Stores.js'],
				dest: 'dist/<%= pkg.name %>.js'
			}
		},
		min: {
			dist: {
				src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
				dest: 'dist/<%= pkg.name %>.min.js'
			}
		},
		watch: {
			app: {
				files: ["src/*ls", "test/**/*"],
				tasks: ["default"]
			}
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
	grunt.loadNpmTasks('grunt-contrib-livescript');
	grunt.loadNpmTasks('grunt-docco');
	grunt.loadNpmTasks('grunt-jasmine-node');

	grunt.registerTask('jasmine', 'livescript:jasmine jasmine_node');
	grunt.registerTask('tests', 'livescript:qunit qunit jasmine');
	grunt.registerTask('default', 'clean livescript concat min tests');
};
