// パッケージをインポートする
var gulp = require('gulp');
var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'gulp.*'],
  replaceString: /\bgulp[\-.]/
});
var fs = require('fs');
var pngquant = require('imagemin-pngquant');
var runSequence = require('run-sequence');
var del = require('del');
var browserify = require ('browserify');
var karma = require('karma').server;

var dir = {
  src: 'src',
  dist: 'dist'
};

var pass = {
  data: dir.src + '/data'
};

//---------------------
// タスクの定義
//---------------------
// 簡易サーバー
gulp.task('connect', function() {
  return $.connect.server({
    port: 3000, // ポート番号を設定
    root: dir.dist, // ルートディレクトリの場所を指定
    livereload: true // ライブリロードを有効にする
  });
});

// 自動更新
gulp.task("reload", function() {
  gulp.src([
    dir.dist + '/{,**/}*'
    ])
  .pipe($.connect.reload());
});

// ファイルのコピー
gulp.task('copy', function () {
  gulp.src([
    '!' + dir.src + '/img/sprites/*.png',
    '!' + dir.src + '/img/_sprite.scss',
    dir.src + '/img/{,**/}*.{png,jpg,gif}'
    ])
    .pipe(gulp.dest( dir.dist + '/img/' ));
});

// 不要なファイルを削除する
// distフォルダ内を一度全て削除する
gulp.task('clean', function (cb) {
  del([
    dir.dist + '/**'
  ], cb);
});


// 画像を圧縮
gulp.task('imagemin', function () {
  gulp.src( dir.src + '/{,**/}*.{png,jpg,gif}' ) // 読み込みファイル
    .pipe($.imagemin())
    .pipe(gulp.dest( dir.dist )); // 書き出し先
});

// svg を圧縮する
gulp.task('svg-min', function() {
  gulp.src(dir.src + '/img/svg/*.svg')
    .pipe($.svgmin())
    .pipe(dir.src + '/img/svg/*.svg');
});

// アイコンフォント生成
gulp.task('fonts', ['svg-min'], function() {
  gulp.src(dir.src + '/img/fonts')
    .pipe($.clean());
  gulp.src(dir.src + '/img/svg/*.svg')
    .pipe($.plumber())
    .pipe($.iconfontCss({
      fontName:   'icon-font',
      path:       dir.src + '/scss/functions/_icons.scss', // _icon.scss のテンプレート
      targetPath: dir.src + '/scss/_icons.scss', // _icon.scss を生成
      fontPath:   dir.src + "/fonts/"})) // _icon.scss で使うフォントのパス
    .pipe($.iconfont({
      fontName: 'icon-font',
      appendCodepoints: false
    }))
    .pipe(gulp.dest( dir.src + "/fonts/" ));
});

//Compassのタスク
gulp.task('compass',function(){
gulp.src( [dir.src + '/{,**/}*.scss'] )
  .pipe($.plumber())
  .pipe($.imagemin())
  .pipe($.compass({ //コンパイルする処理
    config_file : 'config.rb',
    comments : false,
    css : dir.dist + '/css/',
    sass: dir.src + '/scss/'
  }));
});

//sprite作成
gulp.task('sprite', function() {
  var spriteData = gulp.src(dir.src + '/img/sprites/*.png')
  .pipe($.plumber())
  .pipe($.spritesmith({
    imgName: 'sprite.png',
    cssName: '_sprite.scss',
    imgPath: '../img/sprite.png',
    cssFormat: 'scss',
    cssVarMap: function (sprite) {
      sprite.name = sprite.name; //VarMap(生成されるScssにいろいろな変数の一覧を生成)
  }
  }));

  spriteData.pipe(gulp.dest(dir.dist + '/img'));
  spriteData.css.pipe(gulp.dest(dir.src + '/scss/var'));
});

// typescript
gulp.task('tsc', function(){
  gulp.src([dir.src + '/ts/{,**/}*.ts'])
    .pipe($.plumber())
    .pipe($.tsc({
      removeComments: true
    }))
    .pipe(gulp.dest(dir.dist + '/js/'));
});

// ect
gulp.task('ect', function(){
  var json = JSON.parse(fs.readFileSync(pass.data + '/data.json'));

  gulp.src(dir.src + '/templates/*.ect')
  .pipe($.ect({
    data: function (file, cb) {
      cb({
        filename: file,
        data: json,
        basepath: '/'
      });
    }}))
  .pipe(gulp.dest(dir.dist));
});

// テストの実行
gulp.task('test', function (done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done);
});

// ファイル更新監視
gulp.task('watch', function() {

  gulp.watch([
    dir.src + '/{,**/}*.ect' // 対象ファイル
  ],['ect']); // 実行タスク

  gulp.watch([
    dir.src + '/{,**/}*.scss' // 対象ファイル
  ],['compass']); // 実行タスク（css 開発用）

  gulp.watch([
    dir.src + '/{,**/}*.ts' // 対象ファイル
  ],['tsc']); // 実行タスク（css 開発用）

  gulp.watch([
      dir.dist + '/{,**/}*'
  ], ["reload"]);
});

//---------------------
// タスクの実行
//---------------------
// 開発用
gulp.task('serve', [
  'connect',
  'ect',
  'sprite',
  'compass',
  'tsc',
  'copy',
  'watch'
]);

gulp.task('clean', [
  'clean'
]);
