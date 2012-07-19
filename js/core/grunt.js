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
				src: ['**/*.coffee', '**/*.js']
			}
		},
		qunit: {
			files: ['test/**/*.html']
		},
		coffee: {
			app: {
				files: {
					"dist/coffee/Runtime.js": 'src/Runtime.coffee',
					"dist/coffee/Stores.js": ['src/*Store.coffee']
				}
			}
		},
		concat: {
			dist: {
				src: ['<banner:meta.banner>', 'src/uuid.js', 'dist/coffee/Runtime.js', 'src/Transaction.js', 'src/PostStore.js', 'dist/coffee/Stores.js'],
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
			files: '<config.coffee.app.src>',
			tasks: 'coffee:app'
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

	grunt.registerTask('default', 'clean  coffee concat min');
};
