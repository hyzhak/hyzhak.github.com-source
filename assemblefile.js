var assemble = require('assemble');
var debug = require('gulp-debug');
var less = require('gulp-less');
var plumber = require('gulp-plumber');
var extname = require('gulp-extname');



//================================================

assemble.task('partials', function() {
	return assemble.partials('layouts/partials/*.hbs');
});

assemble.task('layouts', function() {
	return assemble.layouts('theme/layouts/*.hbs');
});

//================================================

assemble.task('html', ['layouts', 'partials'], function() {
	assemble.pages('pages/*.hbs');
	//assemble.data({foo: 'bar', xxx: {yy: 123, zzz: 321}});
	assemble.data('projects/list.yaml');
	//assemble.data('test.json');
	//assemble.data('projects/projects.yaml', { namespace: false });
	console.log(
		JSON.stringify(assemble.get('data'))
	);
	assemble.src(['templates/*.hbs', 'pages/*.hbs'])
		.pipe(plumber())
		.pipe(extname())
		.pipe(debug({title: 'templates:'}))
		.pipe(assemble.dest('dist', {ext: '.html'}))
		.pipe(debug({title: 'html:'}));
});

//================================================

assemble.task('css', function () {
	assemble.src('styles/*.less')
		.pipe(plumber())
		.pipe(less())
		.pipe(debug({title: 'css:'}))
		.pipe(assemble.dest('dist/assets/css'));
});

//================================================

assemble.task('copy-assets', function() {
	return assemble.copy('assets/**', 'dist/');
});

//================================================

assemble.task('watch', function() {
	assemble.watch(['assemblefile.js', 'pages/*', 'templates/*', 'theme/**/*.*'], ['default']);
});

assemble.task('default', ['html', 'css']);