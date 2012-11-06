module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: '<json:package.json>',
		meta: {
			banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
				'<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
				'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
				' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
		},
		clean: {
			all: ['build/', 'lib/', 'dist/']
		},
		concat: {
			lib: {
				src: ['build/*.js'],
				dest: 'build/<%= pkg.name %>.full.js'
			},
			node: {
				src: ['src/node/pre.js', 'build/<%= pkg.name %>.full.js', 'src/node/post.js'],
				dest: 'lib/<%= pkg.name %>.js'
			},
			amd: {
				src: ['src/amd/pre.js', 'build/<%= pkg.name %>.full.js', 'src/amd/post.js'],
				dest: 'lib/<%= pkg.name %>.amd.js'
			},
			min: {
				src: ['src/min/pre.js', 'build/<%= pkg.name %>.full.js', 'src/min/post.js'],
				dest: 'lib/<%= pkg.name %>.min.js'
			}
		},
		copy: {
			src: {
				files: {
					'build/': "src/*.js"
				}
			}
		},
		livescript: {
			src: {
				files: {
					'build/*.js': 'src/*.ls'
				},
				options: {
					bare: true
				}
			},
			jasmine: {
				files: {
					'test/jasmine/node/spec/*.spec.js': 'test/jasmine/node/ls/*.ls'
				}
			}
		},
		server: {
			port: 8000,
			base: "."
		},
		jasmine_node: {
			projectRoot: 'test/jasmine/node',
			specFolderName: 'spec',
			match: "",
			matchall: true
		}
	});

	grunt.loadNpmTasks('grunt-contrib');
	grunt.loadNpmTasks('grunt-livescript');
	grunt.loadNpmTasks('grunt-jasmine-node');

	grunt.registerTask('build', 'livescript:src concat:lib');
	grunt.registerTask('package', 'concat:node');
	grunt.registerTask('jasmine', 'livescript:jasmine jasmine_node');
	grunt.registerTask('testServer', 'server');
	grunt.registerTask('tests', 'testServer');
	grunt.registerTask('default', 'clean build package tests');
};
