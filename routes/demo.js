const Router = require('koa-router')
const router = new Router()
const api = require('../api/demo')
router.get('/', api.showData)

module.exports = router.routes()