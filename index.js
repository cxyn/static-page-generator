/**
 * Created by colin on 2019/06/17.
 */

const Koa = require('koa')
const app = new Koa()
const Router = require('koa-router')
const router = new Router()
const favicon = require('koa-favicon')
const bodyParser = require('koa-bodyparser')
const logger = require('koa-logger')
const cors = require('koa2-cors')
const path = require('path')
const koaNunjucks = require('koa-nunjucks-2')
const static = require('koa-static')
const fundebug = require("fundebug-nodejs")
fundebug.apikey="d6bcab2ba635a359a423b5994d8fcd054222cee818b27ea00ce76d78d911adb3"
const { loggerMiddleware } = require('./middlewares/logger')
const response = require('./middlewares/response')
// const { errorHandler, responseHandler } = require('./middlewares/response')
// const query = require('./config/db')
const port = process.env.PORT || 3003
require('dotenv').config()
app.use(response)
// app.use(loggerMiddleware)
// app.use(errorHandler)
app.use(static('./public'))
app.use(favicon(__dirname + '/public/images/favicon.ico'))
app.use(logger())
app.use(cors())
app.use(bodyParser())
app.use(koaNunjucks({
    ext: 'html',
    path: path.join(__dirname, 'views'),
    nunjucksConfig: {
      trimBlocks: true,
      noCache: true
    },
    configureEnvironment: (env) => {
      env.addGlobal('timestamp', Date.now())
    }
}))
require('./routes')(router)

app.use(router.routes()).use(router.allowedMethods())
// app.use(responseHandler)
app.on("error", fundebug.KoaErrorHandler)
app.listen(port, () => console.log(`服务器运行中, 监听端口号: ${port}`))