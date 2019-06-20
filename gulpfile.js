'use strict';
const gulp         = require('gulp'),
      nodemon      = require('gulp-nodemon'),
      browserSync  = require('browser-sync'),
      reload       = browserSync.reload,
      uglify       = require('gulp-uglify'),
      sass         = require('gulp-sass'),
      autoprefixer = require('gulp-autoprefixer'),
      plumber      = require('gulp-plumber')

// 设置路径
let paths = {  
    client: {
        static: [  
            'public/js/**/*.js',  
            'public/style/**/*.css'  
        ],
        sass: 'public/style/sass/',
        js: 'public/js/',
        css: 'public/style/css/'
    }, 
    
    server: {  
        entry: 'index.js'  
    }  
};  
  
// nodemon 的配置  
let nodemonConfig = {  
    script : paths.server.entry,
    env    : {  
        "NODE_ENV": "development"  
    }  
}
  
// nodemon启服务
gulp.task('node', () => {
    return nodemon(nodemonConfig)
})
 
// 编译scss
gulp.task('sassTask', () => {
    return gulp.src(paths.client.sass + '*.scss')
        .pipe(plumber({
            errorHandler: (err) => {
                console.log(err)
                // this.emit('end') 
            }
        }))
        .pipe(autoprefixer({browsers: ['last 5 version']}))
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(gulp.dest(paths.client.css))
        .pipe(reload({stream: true}))
});

// 反向代理注入，自动刷新客户端
gulp.task('server', ['sassTask', 'node'], function() {
    gulp.watch(paths.client.sass + '*.scss', ['sassTask'])
    let files = [
        'views/**/*.ejs',
        'public/**/*.*'
    ]
    browserSync.init(files, {
        proxy: 'http://localhost:3003', //端口为server端接口
        browser: 'chrome',
        notify: false,
        port: 4000 //这个是browserSync对http://localhost:3003 实现的代理端口
    });
    gulp.watch(files).on("change", reload)
})

//默认任务
gulp.task('default',['server'], ()=> {
    console.log('running…… (Enjoy!)');
});

//压缩javascript 文件，压缩后文件放入build/js下   
gulp.task('minifyjs', () => {
    gulp.src(paths.client.js + '*.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist/js/'))
});
// 最终构建任务
gulp.task('bulid', ['minifyjs'])