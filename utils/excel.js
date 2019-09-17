const xlsx = require('node-xlsx')
const makeDir = require('./makeDir')
const multiparty = require('multiparty')
const path = require('path')
module.exports = {
    /**
     * @description 读取excel文件
     *
     * @param {String} xlsxFile xlsx文件夹路径
     * @return {Array} urlList url数组
     */
    readXlsx: xlsxFile => {
        let obj = xlsx.parse(xlsxFile);
        let urlList = []
        for(let url of obj[0].data) {
            urlList.push(url[0])
        }
        return urlList
    },
    /**
     * @description 上传excel到服务器
     *
     * @param {Object} ctx koa上下文
     * @return {String} 服务器上的图片路径
     */
    uploadExcel: ctx => {
        let uploadExcelDir = path.resolve(__dirname, '../public/uploads/docs')
        makeDir(uploadExcelDir)
        return new Promise((resolve, reject) => {
            let form = new multiparty.Form({ uploadDir: uploadExcelDir })
            form.parse(ctx.req, function (err, fields, files) {
                if (err) {
                    reject()
                } else {
                    if(files && files.file && files.file.length) {
                        let excel = files.file[0].path
                        let excelExt = path.extname(excel) //获取excel后缀
                        let fileName = path.basename(excel)//获取excel名
                        resolve(excel)
                    }
                }
            })
        })
    }
}