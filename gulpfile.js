var del = require('del');
var assign = require('lodash').assign;

var gulp = require('gulp');
var debug = require('gulp-debug');
var frontMatter = require('gulp-front-matter');
var imagemin = require('gulp-imagemin');
var less = require('gulp-less');
var livereload = require('gulp-livereload');
var gulpsmith = require('gulpsmith');

var jpegtran = require('imagemin-jpegtran');

var path = require('path');

var collections = require('metalsmith-collections');
var markdown = require('metalsmith-markdown');
var metadata = require('metalsmith-metadata');
var permalinks = require('metalsmith-permalinks');
var templates = require('metalsmith-templates');

//TODO: add pagination ?, gulp-sourcemaps
//TODO: add to jade moment or somethings

gulp.task('clean:dist', function (done) {
	del(['dist/*'], done);
});

gulp.task('build:html', function () {
	return gulp.src(['./pages/**/*.md', './config.yaml'])
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


gulp.task('build:images:assets', function() {
	return gulp.src('assets/**/*.jpg')
		.pipe(imagemin({
			progressive: true,
			use: [jpegtran()]
		}))
		.pipe(gulp.dest('dist/images'));
});

gulp.task('build:images:projects', function() {
	return gulp.src('pages/**/*.jpg')
		.pipe(imagemin({
			progressive: true,
			use: [jpegtran()]
		}))
		.pipe(gulp.dest('dist/images'));
});

gulp.task('build:images', gulp.parallel('build:images:assets', 'build:images:projects'));


gulp.task('build:styles', function() {
	return gulp.src('./templates/styles/**/*.less')
		.pipe(less({
			paths: [ path.join(__dirname, 'node_modules', 'bootswatch') ]
		}))
		.pipe(gulp.dest('dist/css'));
});

gulp.task('build', gulp.parallel(
	'build:html',
	'build:images',
	'build:styles'));

gulp.task('watch', function () {
	livereload.listen();
	gulp.watch([
			'config.yaml',
			'assets/**/*',
			'pages/**/*',
			'templates/**/*'
		],
		gulp.series('build:all'));
});

gulp.task('default', gulp.series('clean:dist', 'build'));