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
		livescript: {
			app: {
				files: {
					"dist/compiled/Runtime.js": 'src/Runtime.ls',
					"dist/compiled/Transaction.js": 'src/Transaction.ls',
					"dist/compiled/Stores.js": ['src/*Store.ls']
				},
				options: {
					bare: true
				}
			},
			nunit: {
				files: {
					"test/nunit/tests.js": ["test/nunit/**/*ls"]
				}
			},
			qunit: {
				files: {
					"test/qunit/min/ls/tests.js": ["test/qunit/min/ls/*ls"]
				},
				options: {
					bare: true
				}
			},
			jasmine: {
				files: {
					"test/spec/livescript.spec.js": ["test/spec/**/*ls"]
				},
				options: {
					bare: true
				}
			}
		},
		concat: {
			node: {
				src: ['<banner:meta.banner>', 'src/node/pre.js', 'dist/compiled/Runtime.js', 'dist/compiled/Transaction.js', 'src/PostStore.js', 'dist/compiled/Stores.js', 'src/node/post.js'],
				dest: 'lib/<%= pkg.name %>.js'
			},
			min: {
				src: ['<banner:meta.banner>', 'src/min/pre.js', 'dist/compiled/Runtime.js', 'dist/compiled/Transaction.js', 'src/PostStore.js', 'dist/compiled/Stores.js', 'src/min/post.js'],
				dest: 'lib/<%= pkg.name %>.min.js'
			},
			qunitMin: {
				src: ['test/qunit/min/context/*.js', 'test/qunit/min/js/*.js', 'test/qunit/min/ls/tests.js'],
				dest: 'test/qunit/min/tests.js'
			}
		},
		qunit: {
			files: ['test/qunit/**/*.html']
		},
		jasmine_node: {
			specFolderName: "./test/spec/",
			projectRoot: ".",
			requirejs: false,
			forceExit: true,
			jUnit: {
				report: false,
				savePath : "./test/spec/reports/",
				useDotNotation: true,
				consolidate: true
			}
		},
		test: {
			files: ['test/nunit/**/*js']
		},
		browserify: {
			"dist/bundle.js": {
				entries: ["<%= pkg.name %>.js"]
			}
		},
		min: {
			dist: {
				src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
				dest: 'lib/<%= pkg.name %>.min.js'
			}
		},
		watch: {
			app: {
				files: ["src/*ls", "test/**/*"],
				tasks: ["default"]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib');
	grunt.loadNpmTasks('grunt-livescript');
	// grunt.loadNpmTasks('grunt-docco');
	grunt.loadNpmTasks('grunt-jasmine-node');
	// grunt.loadNpmTasks('grunt-browserify');

	grunt.registerTask('jasmineTests', 'livescript:jasmine jasmine_node');
	grunt.registerTask('qunitTests', 'livescript:qunit concat:qunitMin qunit');
	grunt.registerTask('nunit', 'test');
	grunt.registerTask('nunitTests', 'livescript:nunit nunit');
	grunt.registerTask('tests', 'nunitTests qunitTests');
	grunt.registerTask('default', 'clean livescript concat:node concat:min tests');
};
