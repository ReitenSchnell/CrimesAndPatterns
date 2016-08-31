var gulp      = require('gulp');
var gutil     = require('gulp-util');
var connect   = require('gulp-connect');
var concat    = require('gulp-concat');
var tplCache  = require('gulp-angular-templatecache');
var replace   = require('gulp-replace');
var open      = require('gulp-open');
var rev       = require('gulp-rev-append');
var uglify    = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var rename    = require("gulp-rename");

gulp.task('appJS', function() {
  // concatenate js files
  // into build/app.js
  return gulp.src([
    './app/index.module.js',
    './app/index.route.js',
    './app/index.config.js',
    './app/index.run.js',
    './app/**/*.js'])
    //.pipe(uglify({ mangle: false }))
    .pipe(concat('app.js'))
    .pipe(gulp.dest('./build'))
});

gulp.task('templates', function() {
  // combine html template files into
  // build/template.js
  gulp.src(['!./app/index.html', './app/**/*.html'])
    .pipe(tplCache('templates.js',{standalone:true}))
    .pipe(gulp.dest('./build'))
});

gulp.task('appCSS', function() {
  // concatenate CSS
  // into build/app.css
  return gulp
    .src([
      './app/**/*.css',
      './app/*.css'
    ])
    .pipe(uglifycss({
      "maxLineLen": 80,
      "uglyComments": true
    }))
    .pipe(concat('app.css'))
    .pipe(gulp.dest('./build') )
});

gulp.task('libJS', function() {
  // concatenate vendor JS into build/lib.js
  return gulp.src([
    './bower_components/jquery/dist/jquery.min.js',
    './bower_components/angular/angular.min.js',
    './bower_components/angular-route/angular-route.min.js',
    './bower_components/angular-sanitize/angular-sanitize.min.js',

    './bower_components/angular-animate/angular-animate.min.js',
    './bower_components/angular-aria/angular-aria.min.js',
    './bower_components/angular-cookies/angular-cookies.min.js',
    './bower_components/angular-material/angular-material.min.js',
    './bower_components/angular-material-icons/angular-material-icons.min.js',
    './bower_components/angular-mocks/angular-mocks.js',
    './bower_components/angular-resource/angular-resource.min.js',
    './bower_components/angular-facebook/lib/angular-facebook.js',
    './bower_components/angular-facebook/lib/angular-facebook-phonegap.js',

    './bower_components/angular-touch/angular-touch.min.js',
    './bower_components/moment/min/moment.min.js',
    './bower_components/d3/d3.min.js',
    './bower_components/topojson/topojson.min.js',
    './bower_components/underscore/underscore-min.js',
    './bower_components/angular-bootstrap/ui-bootstrap.min.js',
    './bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
    './bower_components/ngprogress/build/ngprogress.min.js'
  ])
    .pipe(concat('lib.js'))
    .pipe(gulp.dest('./build'));
});

gulp.task('libCSS', function() {
    // concatenate vendor css into build/lib.css
    return gulp.src(['!./bower_components/**/*.min.css',
      './bower_components/**/*.css'])
      .pipe(uglifycss({
        "maxLineLen": 80,
        "uglyComments": true
      }))
      .pipe(concat('lib.css'))
      .pipe(gulp.dest('./build'));
  });

gulp.task('index', function() {
  return gulp.src(['./app/index.html'])
    .pipe(gulp.dest('./build'));
});

gulp.task('assets', function() {
  return gulp.src(['./assets/*.*'])
    .pipe(gulp.dest('./build'));
});

gulp.task('fonts', function() {
  return gulp.src(['./bower_components/bootstrap/fonts/*.*'])
    .pipe(gulp.dest('./build/fonts'));
});

gulp.task('rev', ['index', 'appJS', 'templates', 'appCSS',  'libJS', 'libCSS', 'assets', 'fonts'],  function(){
  return  gulp.src('./build/index.html')
    .pipe(rev())
    .pipe(gulp.dest('./build'))
});

gulp.task('localhost', function() {
  gulp.src('')
    .pipe(open({uri: 'http://localhost:7000/'}));
});

gulp.task('watch',function() {

  // reload connect server on built file change
  gulp.watch([
    'build/**/*.html',
    'build/**/*.js',
    'build/**/*.css',
    'build/**/*.png'
  ], function(event) {
    return gulp.src(event.path)
      .pipe(connect.reload());
  });

  // watch files to build
  gulp.watch(['./app/**/*.js'], ['rev']);
  gulp.watch(['!./app/index.html', './app/**/*.html'], ['rev']);
  gulp.watch(['./app/**/*.less', './app/**/*.css'], ['rev']);
  gulp.watch(['./app/index.html'], ['rev']);
});

gulp.task('connect', connect.server({
  root: ['build'],
  port: 7000,
  livereload: true
}));

gulp.task('build', ['rev']);

gulp.task('default', ['connect', 'build', 'watch', 'localhost']);

gulp.task('server', ['connect', 'watch', 'localhost']);
