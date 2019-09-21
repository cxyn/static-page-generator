/**
 * @description 递归创建文件夹
 *
 * @param {String} dir 文件夹路径
 * @return {bolleen} 含有heightArray的对象
 */
const fs = require('fs')
const path = require('path')
function mkdirsSync(dir) {
    if (fs.existsSync(dir)) {
        return true
    } else {
        if (mkdirsSync(path.dirname(dir))) {
          fs.mkdirSync(dir)
          return true
        }
    }
}
module.exports = mkdirsSync