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
		livescript: {
			app: {
				files: {
					"dist/compiled/Runtime.js": 'src/Runtime.ls',
					"dist/compiled/Transaction.js": 'src/Transaction.ls',
					"dist/compiled/Stores.js": ['src/ObjectStore.ls', 'src/LocalStore.ls', 'src/PostStore.ls']
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
					"test/qunit/min/ls/compiled/*.js": ["test/qunit/min/ls/*ls"]
				},
				options: {
					bare: true
				}
			},
			jasmine: {
				files: {
					'test/spec/node/spec/*.spec.js': 'test/spec/node/ls/*.ls'
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
				src: ['test/qunit/min/js/*.js', 'test/qunit/min/ls/tests.js'],
				dest: 'test/qunit/min/tests.js'
			}
		},
		jasmine_node: {
			projectRoot: 'test/spec/node',
			specFolderName: 'spec',
			match: "",
			matchall: true
		},
		test: {
			files: ['test/nunit/**/*js']
		},
		qunit: {
			min: {
				src: ['http://localhost:8000/test/qunit/min/qunit.html']
			}
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
		},
		server: {
			test: {
				port: 8000,
				base: '.'
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib');
	grunt.loadNpmTasks('grunt-livescript');
	grunt.loadNpmTasks('grunt-jasmine-node');

	grunt.registerTask('jasmineTests', 'livescript:jasmine jasmine_node');
	grunt.registerTask('qunitTests', 'livescript:qunit concat:qunitMin qunit:min');
	grunt.registerTask('nunit', 'test');
	grunt.registerTask('nunitTests', 'livescript:nunit nunit');
	grunt.registerTask('tests', 'server:test nunitTests qunitTests jasmineTests');
	grunt.registerTask('default', 'clean livescript concat:node concat:min tests');
};
