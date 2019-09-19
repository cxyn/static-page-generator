const controllers = require('../controllers/index')
const fs = require('fs')
const gm = require('gm')
const path = require('path')
// const upload = require("../utils/upload")
const removeAll = require("../utils/removeAll")
const oss = require("../utils/oss")
const request = require('request')
const multiparty = require('multiparty')
const currentDate = require("../utils/getCurrentDate")
const uuidv1 = require('uuid/v1')
const makeDir = require('../utils/makeDir')
const imagemin = require('imagemin')
const imageminJpegtran = require('imagemin-jpegtran')
const imageminPngquant = require('imagemin-pngquant')
module.exports = (router) => {
    router.get('/', controllers.generator.init) // 首页
    router.get('/readXlsx', controllers.excel.read)       // 读取excel接口
    router.post('/uploadLocal', controllers.excel.upload) // 上传excel接口
    /**
     * @description 上传图片到服务器
     *
     * @param {Object} ctx koa上下文
     * @return {String} 服务器上的图片路径
     */
    function uploadImg(ctx) {
        let uploadImgDir = path.resolve(__dirname, '../public/uploads/originalImages')
        makeDir(uploadImgDir)
        return new Promise((resolve, reject) => {
            let form = new multiparty.Form({ uploadDir: uploadImgDir })
            form.parse(ctx.req, function (err, fields, files) {
                if (err) {
                    reject()
                } else {
                    if(files && files.file && files.file.length) {
                        //let img = path.join(__dirname, '../') + files.file[0].path  //当前切图的主体
                        let img = files.file[0].path
                        mobile.reqInfo = {
                            linkInfor: JSON.parse(fields.linkInfor[0]),
                            type: fields.type[0],
                            baseHeight: fields.baseHeight[0],
                            title: fields.title[0],
                            keywords: fields.keywords[0],
                            description: fields.description[0],
                            naturalWidth: fields.naturalWidth[0],
                            naturalHeight: fields.naturalHeight[0]
                        }
                        resolve(img)
                    }
                }
            })
        })
    }

    /**
     * @description 计算每张切图的宽高
     *
     * @param {Object} obj 图片尺寸 - 宽度(obj.naturalWidth) & 高度(obj.naturalHeight) & 切图的基础高度值(obj.baseHight)
     * @return {Object} 含有heightArray的对象
     */
    async function storeSize(obj) {
        console.log('第 1 步：计算每块切图高度')
        let width = obj.naturalWidth
        let height = obj.naturalHeight
        let baseHeight = obj.baseHeight
        let areaCount = Math.ceil(height / baseHeight)      //计算出的切图数量
        let lastHeight = (height % baseHeight).toString()   //最后一块切图的高度
        obj.heightArray = []                                //存储每张切图的高度
        let i = 0
        for (i; i < areaCount; i++) {
            if (lastHeight) {
                if (i === areaCount - 1) {
                    obj.heightArray.push(lastHeight)
                } else {
                    obj.heightArray.push(baseHeight)
                }
            } else {
                obj.heightArray.push(baseHeight)
            }
        }
        return await obj
    }

    /**
     * @description 计算切图坐标
     *
     * @param {Object} 每张切图的高度数组(obj.heightArr) & 切图宽度(obj.naturalWidth) 
     * @return {Object} 含有positionArray 切图坐标数组的对象
     */
    function cropPosition(obj) {
        let coordinate_x = obj.type === 'pc'? 360 : 0
        let imgWidth = obj.type === 'pc'? 1200 : obj.naturalWidth
        return new Promise((resolve, reject) => {
            obj.positionArray = []
            obj.heightArray.reduce((prev, curr, idx) => {
                obj.positionArray.push({
                    size: {
                        width: imgWidth,
                        height: curr
                    },
                    coordinate: {
                        x: coordinate_x,
                        y: prev
                    }
                })
                return parseInt(curr) + parseInt(prev)
            }, 0)
            if (obj.type === 'pc') {
                obj.positionArray.push(
                    {
                        size: {
                            width: 370,
                            height: obj.naturalHeight
                        },
                        coordinate: {
                            x: 0,
                            y: 0
                        }
                    },
                    {
                        size: {
                            width: 370,
                            height: obj.naturalHeight
                        },
                        coordinate: {
                            x: 1550,
                            y: 0
                        }
                    }
                )
            }
            console.log('第 2 步：计算切图坐标')
            resolve(obj)
        })
    }
    /**
     * @description 切图api调用，累加实现计算坐标位置
     *
     * @param {Object} obj imgObject 切图主体 & positionArr 切图坐标数组
     * @return {String} promise 切图文件夹
     */
    function crop(obj) {
        let imgObject = obj.img
        let positionArr = obj.positionArray
        let imgExt  = path.extname(obj.img)
        let now = Date.now()
        let cropDir = path.join(__dirname, '../public/uploads/') + 'page-' + now + path.sep
        makeDir(cropDir)
        obj.cropDir = cropDir
        let cropName = ''
        let promises = positionArr.map((postion, idx) => {
            if(postion.size.width == '370') {
                cropName = cropDir + '/aside-' + (idx + 1).toString() + imgExt
            } else {
                cropName = cropDir + '/img-' + (idx + 1).toString().padStart(2, '0') + imgExt
            }
            return new Promise((resolve, reject) => {
                gm(imgObject)
                    .crop(postion.size.width, postion.size.height, postion.coordinate.x, postion.coordinate.y)
                    .write(cropName, (err, out) => {
                        if (err) {
                            console.log(err)
                            reject(err)
                        }
                        resolve(obj)
                    })
            })
        })
        console.log('第 3 步：切图')
        return Promise.all(promises)
    }

    /**
     * @description 递归遍历文件夹读取图片
     *
     * @param {String} dir 切图文件夹路径
     * @param {Array} fileArr 切图数组
     * @return {Array} fileArr 切图数组
     */
    function readDir(obj) {
        let extname = path.extname(obj.img)

        let dir = obj.cropDir
        if (!dir) return
        
        return new Promise((resolve, reject) => {
            var fileArr = fileArr || []
            let files = fs.readdirSync(dir)
            let ext = ''
            for (let i of files) {
                let fileName = dir + i
                ext = path.extname(fileName).toLowerCase()
                if (ext.match('jpg') || ext.match('jpeg') || ext.match('png') || ext.match('html')) {
                    fileArr.push(fileName)
                }
            }
            let pattern =/^.+public(\/.+)$/
            let newFileArray = fileArr.map(item => {
                let newItem = item.split(path.sep).join('/');
                return newItem.match(pattern)[1]
            })
            obj.fileArray = newFileArray
            console.log('第 4 步：读取本地文件')
            if (obj.type === 'pc') {
                gm(obj.naturalWidth, obj.naturalHeight, "#ffffff")
                    .in('-page', '+0+0')
                    .in(`${obj.cropDir}${files[0]}`)
                    .in('-page', '+1550+0')
                    .in(`${obj.cropDir}${files[1]}`)
                    .mosaic()
                    .write(`${obj.cropDir}background${extname}`, err => {
                        if (err) console.log(err);
                    })
                obj.bgImg = `background${extname}`
            }
            resolve(obj)
        })
    }

    /**
     * @description 压缩图片
     *
     * @param {String} obj 切图文件夹路径
     * @return {Array} fileArr 压缩切图数组
     */
    async function compressImg(obj) {
        let dir = obj.cropDir
        const files = await imagemin([dir + '/*.{jpg,JPG,jpeg,JPEG,png,PNG}'], {
            destination: dir,
            plugins: [
                imageminJpegtran({
                    quality: [0.6, 0.8]
                }),
                imageminPngquant({
                    quality: [0.6, 0.8]
                })
            ]
        })
        return await obj
    }

    /**
     * @description 递归遍历文件夹读取图片和html
     *
     * @param {String} dir 切图文件夹路径
     * @param {Array} fileArr 切图数组
     * @return {Array} fileArr 切图数组
     */
    function readDir2(obj) {
        let dir = obj.cropDir
        if (!dir) return
        return new Promise((resolve, reject) => {
            var fileArr = fileArr || []
            let files = fs.readdirSync(dir)
            for (let i of files) {
                if (!i.includes('aside')) {
                    let fileName = dir + i
                    fileArr.push(fileName)
                }
            }
            resolve(fileArr)
        })
    }

    /**
     * @description 循环上传阿里云
     *
     * @param {Array} imgArray 切图文件夹路径
     * @return {String} 上传后的图片url
     */
    function uploadToOss(fileList) {
        let uuid = uuidv1()
        let promises = fileList.map((file, index) => {
            return new Promise((resolve, reject) => {
                try {
                    var result = oss.put('static/pages/auto/' + currentDate + '/' + uuid + '/' + path.basename(file), file)
                    resolve(result)
                } catch (err) {
                    console.log(err)
                    reject(err)
                }
            })

        })
        return Promise.all(promises)
    }
    var mobile = mobile || {}
    mobile.uuid = uuidv1()

    // 生成页面接口
    router.post('/generatorPage', async (ctx, next) => {
        await uploadImg(ctx).then(img => {
            mobile.reqInfo.img = img
            return storeSize(mobile.reqInfo)
        }).then(obj => {
            return cropPosition(obj)
        }).then(obj => {
            return crop(obj)
        }).then(obj => {
            return readDir(obj[0])
        }).then(obj => {
            return compressImg(obj)
        }).then(obj => {
            obj.pageUrl = ctx.origin + '/static-page-' + mobile.uuid
            obj.fileArrayOnline = obj.fileArray.map(item => {
                var arr = item.split('/')
                return arr[arr.length - 1]
            })
            if (obj.type === 'pc') {
                obj.fileArrayOnline.splice(0,2)
            }
            console.log(obj.fileArrayOnline)
            router.get('/static-page-' + mobile.uuid, async (ctx, next) => {
                await ctx.render(`template-${obj.type}`, {
                    obj
                })
            })
        }).then(() => { // 生成静态html
            return new Promise((resolve, reject) => {
                let pageName = Date.now() + '.html'
                let currentDir = mobile.reqInfo.fileArray[mobile.reqInfo.fileArray.length - 1].match(/^(.+)img-.+$/)[1]
                let htmlPath = path.join(__dirname, '../public/' + currentDir, pageName)
                let writeStream = fs.createWriteStream(htmlPath)
                request(mobile.reqInfo.pageUrl).pipe(writeStream)
                writeStream.on('finish', () => { // 写入成功
                    resolve(ctx.origin + currentDir + pageName)
                })
            })
        }).then(url => { // 读取文件夹下所有图片和html
            return readDir2(mobile.reqInfo)
        }).then(fileList => { //上传至阿里云
            return uploadToOss(fileList)
        }).then(list => { // 接口输出
            let host = 'https://fe-static.htd.cn/'
            ctx.body = {
                code: 1,
                message: 'success',
                data: {
                    url: host + list[0].name
                }
            }
        }).catch(e => {
            ctx.body = {
                code: 0,
                message: 'fail',
                data: e
            }
        }) 
    })
}