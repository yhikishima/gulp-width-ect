// パッケージをインポートする
var gulp = require('gulp');
var fs = require('fs');
var plugin = require('gulp-load-plugins')();

var compass = require('gulp-compass');
var connect = require('gulp-connect');
var watch = require('gulp-watch');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var runSequence = require('run-sequence');
var clean = require('gulp-clean');
var ect = require('gulp-ect');
var plumber = require('gulp-plumber');
var spritesmith = require("gulp.spritesmith");

var dir = {
  src: 'src',
  dist: 'dist'
};

var pass = {
  data: dir.src + '/data'
};

// 簡易サーバー
gulp.task('connect', function() {
  return connect.server({
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
  .pipe(connect.reload());
});

// ファイルのコピー
gulp.task('copy', function () {
  return gulp.src([
      dir.src + '/{,**/}*.html', // 対象ファイル
      dir.src + '/{,**/}*.js'
    ])
    .pipe(gulp.dest( dir.dist ));
});

// 不要なファイルを削除する
// distフォルダ内を一度全て削除する
gulp.task('clean-dist', function () {
  gulp.src([
    dir.dist + '*.**'
    ], {read: false} )
  .pipe(clean());
});

// スプライト画像の生成データを全て削除する
gulp.task('clean-sprite', function () {
  gulp.src( [
    dir.dist + '/{,**/}sprite-*.png', // 乱数付きのスプライト画像
    dir.dist + '/{,**/}sprite' // スプライト画像生成フォルダ
  ], {read: false} )
    .pipe(clean());
});

// 画像を圧縮
gulp.task('imagemin', function () {
  gulp.src( dir.src + '/{,**/}*.{png,jpg,gif}' ) // 読み込みファイル
    .pipe(imagemin())
    .pipe(gulp.dest( dir.dist )); // 書き出し先
});

//Compassのタスク
gulp.task('compass',function(){
gulp.src( [dir.src + '/{,**/}*.scss'] )
  .pipe(plumber())
  .pipe(imagemin())
  .pipe(compass({ //コンパイルする処理
    config_file : 'config.rb',
    comments : false,
    css : dir.dist + '/css/',
    sass: dir.src + '/scss/'
  }));
});

//sprite作成
gulp.task('sprite', function() {
  var spriteData = gulp.src(dir.src + '/img/sprites/*.png')
  .pipe(plumber())
  .pipe(spritesmith({
    imgName: 'sprite.png',
    cssName: '_sprite.scss',
    imgPath: '../img/sprite.png',
    cssFormat: 'scss',
    cssVarMap: function (sprite) {
      sprite.name = 'sprite-' + sprite.name; //VarMap(生成されるScssにいろいろな変数の一覧を生成)
  }
  }));

  spriteData.pipe(gulp.dest(dir.dist + '/img'));
  spriteData.css.pipe(gulp.dest(dir.src + '/scss/var'));
});

// ect
gulp.task('ect', function(){
  var json = JSON.parse(fs.readFileSync(pass.data + '/data.json'));

  gulp.src(dir.src + '/templates/*.ect')
  .pipe(ect({
    data: function (file, cb) {
      cb({
        filename: file,
        data: json
      });
    }}))
  .pipe(gulp.dest(dir.dist));
});

// ファイル更新監視
gulp.task('watch', function() {
  // ectの監視
  gulp.watch([
    dir.src + '/{,**/}*.ect' // 対象ファイル
  ],['ect']); // 実行タスク

  // scssの監視
  gulp.watch([
    dir.src + '/{,**/}*.scss' // 対象ファイル
  ],['compass']); // 実行タスク（css 開発用）

  gulp.watch([
      dir.dist + '/{,**/}*'
  ], ["reload"]);
});

// タスクの登録
// 開発用
gulp.task('serve', [
  'connect',
  'clean-dist',
  'sprite',
  'watch'
]);
