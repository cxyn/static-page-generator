const multer = require('koa-multer')
const path = require('path')
const fs = require('fs')
function mkdirsSync(dir) {
  if (fs.existsSync(dir)) {
    return true;
  } else {
    if (mkdirsSync(path.dirname(dir))) {
      fs.mkdirSync(dir);
      return true;
    }
  }
}
const storage = multer.diskStorage({
  destination:'public/uploads/' + String(new Date().getFullYear()) + String(new Date().getMonth() + 1) + String(new Date().getDate()),
  filename(ctx,file,cb){
    let todayDir = String(new Date().getFullYear()) + String(new Date().getMonth() + 1) + String(new Date().getDate())
    let upDir = path.join(__dirname, '../public/')
    let upDirStr =  upDir + 'uploads/'
    let isUpDirExists = fs.existsSync(upDirStr)
    let dirString = upDirStr + todayDir
    let isExists = fs.existsSync(dirString)
    mkdirsSync(dirString)
    const filenameArr = file.originalname.split('.')
    cb(null,Date.now() + '.' + filenameArr[filenameArr.length-1])
  }
});

const upload = multer({storage});

module.exports = upload;