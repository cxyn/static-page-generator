const fs = require('fs')
function removeAll(path) {
    let files = []
    if(fs.existsSync(path)) {
        files = fs.readdirSync(path)
        files.forEach((file, index) => {
            let currentPath = path + "/" + file
            if (fs.statSync(currentPath).isDirectory()) {
                removeAll(currentPath)
            } else {
                fs.unlinkSync(currentPath)
            }
        })
        fs.rmdirSync(path)
    }
}
module.exports = removeAll