const fs = require('fs')
const path = require('path')
const multiparty = require('multiparty')
const currentDate = require("../utils/getCurrentDate")
const oss = require("../utils/oss")
const readChunk = require('read-chunk')
const imageType = require('image-type')
// 基于formData的上传(用于移动端)
module.exports = {
    uploadShareThumbnail: async (ctx, next) => {
        function uploadImg() {
            let data = {
                code: 0,
                message: '',
                data: null
            }
            return new Promise((resolve, reject) => {
                let form = new multiparty.Form({
                    uploadDir: './public/uploads/'
                })
                form.parse(ctx.req, function (err, fields, files) {
                    if (err) {
                        data.message = '解析失败'
                        reject(data)
                    } else {
                        if (files !== undefined && files !== {} && files.file !== undefined) {
                            if (files.file.length > 0) {
                                let filename = files.file[0].path
                                // let realname = files.file[0].originalFilename

                                let currentImagePath = path.resolve(__dirname, '../', files.file[0].path)
                                const buffer = readChunk.sync(currentImagePath, 0, 12)
                                let imgInfo = imageType(buffer)
                                if (imgInfo) {
                                    if (imageType(buffer).mime.includes('image')) {
                                        let imageName = path.basename(currentImagePath)
                                        oss.put('static/shareThumbnail/customization/' + currentDate + '/' + imageName, currentImagePath).then(function (rst) {
                                            data.code = 1
                                            data.message = '上传成功'
                                            data.data = `https://fe-static.htd.cn/${rst.name}`
                                            fs.unlinkSync(currentImagePath)
                                            resolve(data)
                                        }).catch(function (err) {
                                            data.error = err
                                            fs.unlinkSync(currentImagePath)
                                            resolve(data)
                                        })
                                    }
                                }else {
                                    data.message = '请上传图片文件'
                                    fs.unlinkSync(filename) //删除非图片文件
                                    resolve(data)
                                }
                            }
                        } else {
                            data.message = "未上传文件"
                            resolve(data)
                        }
                    }
                })
            })
        }
        await uploadImg().then(res => {
            ctx.body = res
        })
    }
}