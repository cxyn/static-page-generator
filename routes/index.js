module.exports = (router) => {
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
    const xlsx = require('node-xlsx')
    const makeDir = require('../utils/makeDir')
    const imagemin = require('imagemin')
    const imageminJpegtran = require('imagemin-jpegtran')
    const imageminPngquant = require('imagemin-pngquant')

    router.get('/', async (ctx, next) => {
        await ctx.render('index', {

        })
    })

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
                        console.log(mobile.reqInfo)
                        console.log('mobile.reqInfo', mobile.reqInfo)
                        resolve(img)
                    }
                }
            })
        })
    }
    /**
     * @description 上传excel到服务器
     *
     * @param {Object} ctx koa上下文
     * @return {String} 服务器上的图片路径
     */
    function uploadExcel(ctx) {
        let uploadExcelDir = path.resolve(__dirname, '../public/uploads/docs')
        console.log()
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
        let promises = positionArr.map((postion, idx) => {
            return new Promise((resolve, reject) => {
                gm(imgObject)
                    .crop(postion.size.width, postion.size.height, postion.coordinate.x, postion.coordinate.y)
                    .write(cropDir + '/img-' + (idx + 1).toString().padStart(2, '0') + imgExt, (err, out) => {
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
        if (obj.type === 'pc') {
            fs.createReadStream(obj.img).pipe(fs.createWriteStream(`${obj.cropDir}background${extname}`))
            obj.bgImg = `background${extname}`
        }

        let dir = obj.cropDir
        if (!dir) return
        
        return new Promise((resolve, reject) => {
            var fileArr = fileArr || []
            let files = fs.readdirSync(dir)
            let ext = ''
            for (let i of files) {
                let fileName = dir + i
                ext = path.extname(fileName)
                if (ext.match('jpg') || ext.match('png') || ext.match('html')) {
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
        const files = await imagemin([dir + '/*.{jpg,png}'], {
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
     * @description 读取excel文件
     *
     * @param {String} xlsxFile xlsx文件夹路径
     * @return {Array} urlList url数组
     */
    function readXlsx(xlsxFile) {
        let obj = xlsx.parse(xlsxFile);
        let urlList = []
        for(let url of obj[0].data) {
            urlList.push(url[0])
        }
        return urlList
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
                let fileName = dir + i
                fileArr.push(fileName)
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
            return compressImg(obj.cropDir)
        }).then(obj => {
            obj.pageUrl = ctx.origin + '/static-page-' + mobile.uuid
            obj.fileArrayOnline = obj.fileArray.map(item => {
                var arr = item.split('/')
                return arr[arr.length - 1]
            })
            if (obj.type === 'pc') {
                console.log('删掉background')
                obj.fileArrayOnline.shift()
            }
            router.get('/static-page-' + mobile.uuid, async (ctx, next) => {
                await ctx.render(`template-${obj.type}`, {
                    obj
                })
            })
        }).then(() => { // 生成静态html
            return new Promise((resolve, reject) => {
                let pageName = Date.now() + '.html'
                let currentDir = mobile.reqInfo.fileArray[1].match(/^(.+)img-.+$/)[1]
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

    // 读取excel接口
    router.get('/readXlsx', async (ctx, next) => {
        let urlList = readXlsx(ctx.querystring)
        ctx.body = {
            code: 1,
            message: 'success',
            data: urlList
        }
    })

    // 上传excel接口
    router.post('/uploadLocal', async (ctx, next) => {
        await uploadExcel(ctx).then(excelPath => {
            ctx.body = {
                code: 1,
                message: 'success',
                data: {
                    url: excelPath
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