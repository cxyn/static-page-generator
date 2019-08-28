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
const views = require('koa-views')
const static = require('koa-static')
const { loggerMiddleware } = require('./middlewares/logger')
const { errorHandler, responseHandler } = require('./middlewares/response')
// const query = require('./config/db')
const port = process.env.PORT || 3003
require('dotenv').config()
// app.use(loggerMiddleware)
app.use(errorHandler)
app.use(static('./public'))
app.use(views(path.join(__dirname, './views'), {
    extension: 'ejs'
}))
app.use(favicon(__dirname + '/public/images/favicon.ico'))
app.use(logger())
app.use(cors())
app.use(bodyParser())
require('./routes')(router)

app.use(router.routes()).use(router.allowedMethods())
app.use(responseHandler)
app.listen(port, () => console.log(`服务器运行中, 监听端口号: ${port}`))