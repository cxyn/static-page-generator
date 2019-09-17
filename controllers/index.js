const fs = require('fs')
const path = require('path')
const basename = path.basename(__filename) //获取当前文件名 -- index.js
const extname = path.extname(__filename) //获取当前文件名后缀 -- .js
const files = fs.readdirSync(__dirname).filter(file => file !== basename) //读取当前目录除了本文件以外的其他所有文件
const controllers = {}
for (const file of files) {
    const controller = require(`./${file}`)
    controllers[path.basename(file, extname)] = controller
}
module.exports = controllers