const multer = require('koa-multer')
const path = require('path')
const fs = require('fs')
const currentDate = require("../utils/getCurrentDate")
const mkdirSync = require('../utils/makeDir')
const storage = multer.diskStorage({
  destination:'public/uploads/' + currentDate,
  filename(ctx, file, cb){
    let dateObj = new Date()
    let todayDir = dateObj.getFullYear().toString() + (dateObj.getMonth() + 1).toString().padStart(2, '0') + dateObj.getDate().toString().padStart(2, '0')
    let upDir = path.join(__dirname, '../public/')
    let upDirStr =  upDir + 'uploads/'
    // let isUpDirExists = fs.existsSync(upDirStr)
    let dirString = upDirStr + todayDir
    // let isExists = fs.existsSync(dirString)
    mkdirSync(dirString)
    const filenameArr = file.originalname.split('.')
    cb(null, Date.now() + '.' + filenameArr[filenameArr.length-1])
  }
});

const upload = multer({storage});

module.exports = upload;