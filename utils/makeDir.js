const fs = require('fs')
module.exports = function(dir) {
    try {
        fs.statSync(dir)
        console.log('目录已存在')
    } catch (e) {
        fs.mkdir(dir, (err) => {
            if (err) {
                console.log(err)
                return
            }
            console.log('创建目录成功')
        })
    }
}