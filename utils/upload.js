const multer = require('koa-multer')
const path = require('path')
const fs = require('fs')
const storage = multer.diskStorage({
  destination:'public/uploads/' + String(new Date().getFullYear()) + String(new Date().getMonth() + 1) + String(new Date().getDate()),
  filename(ctx,file,cb){
    let todayDir = String(new Date().getFullYear()) + String(new Date().getMonth() + 1) + String(new Date().getDate())
    let upDir = path.join(__dirname, '../public/uploads/')
    let dirString = upDir + todayDir
    let isExists = fs.existsSync(dirString)
    if(!isExists) {
      fs.mkdirSync(dirString, (err) => {
        if(err) {
          console.log(err)
          return
        }
        console.log('创建成功')
      })
    }

    const filenameArr = file.originalname.split('.')
    cb(null,Date.now() + '.' + filenameArr[filenameArr.length-1])
  }
});

const upload = multer({storage});

module.exports = upload;