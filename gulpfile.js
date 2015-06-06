var del = require('del');
var assign = require('lodash').assign;

var gulp = require('gulp');
var debug = require('gulp-debug');
var frontMatter = require('gulp-front-matter');
var livereload = require('gulp-livereload');
var gulpsmith = require('gulpsmith');

var collections = require('metalsmith-collections');
var markdown = require('metalsmith-markdown');
var metadata = require('metalsmith-metadata');
var permalinks = require('metalsmith-permalinks');
var templates = require('metalsmith-templates');

//TODO: add pagination, gulp-imagemin, gulp-sourcemaps
//TODO: add to jade moment

gulp.task('clean:dist', function (done) {
	del(['dist/*'], done);
});

gulp.task('build:all', function () {
	return gulp.src(['./pages/**/*', './config.yaml'])
		.pipe(frontMatter().on('data', function (file) {
			assign(file, file.frontMatter);
			delete file.frontMatter;
		}))
		.pipe(gulpsmith()
			.use(metadata({
				config: 'config.yaml'
			}))
			.use(collections({
				projects: {
					pattern: 'projects/*.md',
					sortBy: 'publishDate'
				}
			}))
			.use(markdown())
			.use(permalinks())
			.use(templates({
				engine: 'jade',
				stringify: function(obj) {
					var cache = [];
					var str = JSON.stringify(obj, function(key, value) {
						if (typeof value === 'object' && value !== null) {
							if (cache.indexOf(value) !== -1) {
								// Circular reference found, discard key
								return;
							}
							// Store value in our collection
							cache.push(value);
						}
						return value;
					});
					cache = null; // Enable garbage collection
					return str;
				}
			}))
		)
		.pipe(debug({title: 'build:all'}))
		.pipe(livereload())
		.pipe(gulp.dest('./dist'));
});

gulp.task('watch', function () {
	livereload.listen();
	gulp.watch([
			'pages/**/*',
			'templates/**/*',
			'projects/**/*'
		],
		gulp.series('build:all'));
});

//gulp.task('default', ['clean:dist', 'build:hbs']);
gulp.task('default', gulp.series('clean:dist', 'build:all'));