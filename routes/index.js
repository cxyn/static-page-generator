module.exports = (router) => {
    const fs = require('fs')
    const gm = require('gm')
    const path = require('path')
    const upload = require("../utils/upload")
    const removeAll = require("../utils/removeAll")
    const oss = require("../utils/oss")
    const request = require('request')
    const multiparty = require('multiparty')
    const currentDate = require("../utils/getCurrentDate")
    const moment = require('moment')
    const uuidv1 = require('uuid/v1')

    router.get('/', async (ctx, next) => {
        await ctx.render('index', {

        })
    })
    router.get('/advance', async (ctx, next) => {
        await ctx.render('advance', {

        })
    })

    /**
     * 获取图片尺寸存入对象
     *
     * @param {Object} item 上传的高保真图
     * @return {Object} size 图片尺寸
     */

    function getSize(item) {
        return new Promise((resolve, reject) => {
            gm(item).size((err, size) => {
                if (err) {
                    console.log(err)
                    reject()
                }
                console.log('第一步：获取尺寸')
                resolve(size)
            })
        })
    }

    /**
     * 计算每张切图的宽高
     *
     * @param {Object} size 图片尺寸 - 宽度(size.width) & 高度(size.height)
     * @param {Number} baseHight 切图的基础高度值
     * @return {Object} width 切图宽度 heightArray 高度数组
     */
    async function storeSize(size, baseHight) {
        console.log('第二步：存储尺寸')
        let width = size.width
        let height = size.height
        let areaCount = Math.ceil(size.height / baseHight) //计算出的切图数量
        let lastHeight = size.height % baseHight           //最后一块切图的高度
        let heightArray = []                                      //存储每张切图的高度
        let i = 0
        // console.log('areaCount', areaCount, 'lastHeight', lastHeight)
        for (i; i < areaCount; i++) {
            if (lastHeight) {
                if (i === areaCount - 1) {
                    heightArray.push(lastHeight)
                } else {
                    heightArray.push(baseHight)
                }
            } else {
                heightArray.push(baseHight)
            }
        }
        return await { width, heightArray }
    }

    /**
     * 计算切图坐标
     *
     * @param {Array} heightArr 每张切图的高度数组
     * @param {Number} imgWidth 切图宽度
     * @return {Array} positionArray 切图坐标数组
     */
    function cropPosition(heightArr, imgWidth) {
        return new Promise((resolve, reject) => {
            var positionArray = []
            heightArr.reduce((prev, curr, idx) => {
                positionArray.push({
                    size: {
                        width: imgWidth,
                        height: curr
                    },
                    coordinate: {
                        x: 0,
                        y: prev
                    }
                })
                return curr + prev
            }, 0)
            console.log('第三步：存储位置信息')
            resolve(positionArray)
        })
    }

    /**
     * 切图api调用，累加实现计算坐标位置
     *
     * @param {Object} imgObject 切图主体
     * @param {Array} positionArr 切图坐标数组
     * @return {String} promise 切图文件夹
     */
    function crop(imgObject, positionArr, imgExt) {
        let cropDir = path.join(__dirname, '../public/uploads/') + 'crop-' + Date.now() + '/'
        try {
            fs.statSync(cropDir)
            console.log('切图目录已存在')
        } catch (e) {
            fs.mkdir(cropDir, (err) => {
                if (err) {
                    console.log(err)
                    return
                }
                console.log('创建切图目录成功')
            })
        }
        let promises = positionArr.map((postion, idx) => {
            return new Promise((resolve, reject) => {
                gm(imgObject)
                    .crop(postion.size.width, postion.size.height, postion.coordinate.x, postion.coordinate.y)
                    .write(cropDir + 'crop-' + idx.toString().padStart(3, '10') + imgExt, (err, out) => {
                        if (err) {
                            reject(err)
                        }
                        resolve(cropDir)
                    })
            })
        })
        console.log('第四步：切图')
        return Promise.all(promises)
    }

    /**
     * 递归遍历文件夹读取图片
     *
     * @param {String} dir 切图文件夹路径
     * @param {Array} fileArr 切图数组
     * @return {Array} fileArr 切图数组
     */
    let readDir = function scanFiles(dir, fileArr) {
        console.log('第五步：读取切图')
        if (!dir) return
        return new Promise((resolve, reject) => {
            var fileArr = fileArr || []
            let files = fs.readdirSync(dir)
            let ext = ''
            for (let i of files) {
                let fileName = dir + i
                if (fs.statSync(fileName).isDirectory()) {
                    scanFiles(fileName, fileArr)
                } else {
                    ext = path.extname(fileName)
                    if (ext.match('jpg') || ext.match('png')) {
                        fileArr.push(fileName)
                    }
                }
            }
            resolve(fileArr)
        })
    }

    /**
     * 循环上传阿里云
     *
     * @param {Array} imgArray 切图文件夹路径
     * @return {String} 上传后的图片url
     */
    function uploadToOss(imgArray, imgExt) {
        console.log('第六步：上传切图至阿里云')
        let promises = imgArray.map((img, index) => {
            return new Promise((resolve, reject) => {
                try {
                    var result = oss.put('static/images/' + currentDate + '/crop-' + Date.now() + '-' + index + imgExt, img)
                    resolve(result)
                } catch (err) {
                    reject(err)
                }
            })

        })
        return Promise.all(promises)
    }

    // 路由
    router.post('/upload', upload.single('file'), async (ctx, next) => {
        // console.log(JSON.stringify(ctx.req.file));
        let imgExt = path.extname(ctx.req.file.filename) //获取图片后缀
        let pageInfo = { //后期页面配置取值
            title: '',
            keywords: '',
            description: ''
        }
        let baseHight = 800                   //每块切图的默认基准高度
        let width = 0, height = 0             //设计稿的宽高
        let img = path.join(__dirname, '../') + ctx.req.file.path  //当前切图的主体
        let fileName = ctx.req.file.fileName
        let hash = Date.now()
        await getSize(img)

            .then(size => { // 获取图片尺寸存入数据
                return storeSize(size, baseHight)
            })
            .then(data => { // 计算裁切坐标存入数据
                return cropPosition(data.heightArray, data.width)
            })
            .then(positionArray => { // 切图操作
                return crop(img, positionArray, imgExt)
            })
            .then(dir => { // 读取切图文件夹所有文件
                return readDir(dir[0])
            })
            .then(fileArray => { // 上传至阿里云
                return uploadToOss(fileArray, imgExt)
            })
            .then(urlArray => { //路由注入
                let trueUrl = []
                urlArray.forEach(item => {
                    trueUrl.push('https://fe-static.htd.cn/' + item.name)
                })
                console.log('url', trueUrl)
                router.get('/static-page-' + hash, async (ctx, next) => {
                    await ctx.render('template-mobile', {
                        pageInfo,
                        urlArray
                    })
                })
            })
            .then(() => { // 生成静态html并上传至阿里云
                return new Promise((resolve, reject) => {
                    let htmlPath = path.join(__dirname, '../public/uploads/', currentDate + '/', Date.now() + '.html')
                    let writeStream = fs.createWriteStream(htmlPath)
                    request(ctx.origin + '/static-page-' + hash).pipe(writeStream)
                    writeStream.on('finish', () => { // 写入成功
                        resolve(oss.put('static/pages/' + currentDate + '/' + Date.now() + '.html', htmlPath))
                    })
                })
            })
            .then(urlObj => { // 跳转至线上地址
                let host = 'https://fe-static.htd.cn/'
                let dir = path.join(__dirname, '../public/uploads/')
                // removeAll(dir)
                ctx.redirect(host + urlObj.name)
            })
        ctx.body = 'success'
    })













    /**
     * 计算每张切图的宽高
     *
     * @param {Object} obj 图片尺寸 - 宽度(obj.naturalWidth) & 高度(obj.naturalHeight) & 切图的基础高度值(obj.baseHight)
     * @return {Object} 含有heightArray的对象
     */
    async function m_storeSize(obj) {
        console.log('第二步：存储尺寸')
        let width = obj.naturalWidth
        let height = obj.naturalHeight
        let baseHeight = obj.baseHeight
        let areaCount = Math.ceil(height / baseHeight) //计算出的切图数量
        let lastHeight = height % baseHeight           //最后一块切图的高度
        obj.heightArray = []                          //存储每张切图的高度
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
     * 计算切图坐标
     *
     * @param {Object} 每张切图的高度数组(obj.heightArr) & 切图宽度(obj.naturalWidth) 
     * @return {Array} 含有positionArray 切图坐标数组的对象
     */
    function m_cropPosition(obj) {
        return new Promise((resolve, reject) => {
            obj.positionArray = []
            let imgWidth = obj.naturalWidth
            obj.heightArray.reduce((prev, curr, idx) => {
                obj.positionArray.push({
                    size: {
                        width: imgWidth,
                        height: curr
                    },
                    coordinate: {
                        x: 0,
                        y: prev
                    }
                })
                return parseInt(curr) + parseInt(prev)
            }, 0)
            console.log('第三步：存储位置信息')
            resolve(obj)
        })
    }
    /**
     * 切图api调用，累加实现计算坐标位置
     *
     * @param {Object} obj imgObject 切图主体 & positionArr 切图坐标数组
     * @return {String} promise 切图文件夹
     */
    function m_crop(obj) {
        let imgObject = obj.img
        let positionArr = obj.positionArray
        let imgExt  = path.extname(obj.img)
        let now = Date.now()
        let cropDir = path.join(__dirname, '../public/uploads/') + 'page-' + now + '/'
        obj.cropDir = cropDir
        console.log(obj.cropDir)
        try {
            fs.statSync(cropDir)
            console.log('切图目录已存在')
        } catch (e) {
            fs.mkdir(cropDir, (err) => {
                if (err) {
                    console.log(err)
                    return
                }
                console.log('创建切图目录成功')
            })
        }
        let promises = positionArr.map((postion, idx) => {
            return new Promise((resolve, reject) => {
                gm(imgObject)
                    .crop(postion.size.width, postion.size.height, postion.coordinate.x, postion.coordinate.y)
                    .write(cropDir + 'img-' + (idx + 1).toString().padStart(2, '0') + imgExt, (err, out) => {
                        if (err) {
                            reject(err)
                        }
                        resolve(obj)
                    })
            })
        })
        console.log('第四步：切图')
        return Promise.all(promises)
    }

    /**
     * 递归遍历文件夹读取图片
     *
     * @param {String} dir 切图文件夹路径
     * @param {Array} fileArr 切图数组
     * @return {Array} fileArr 切图数组
     */
    function m_readDir(obj) {
        console.log('第五步：读取切图')
        let dir = obj.cropDir
        if (!dir) return
        return new Promise((resolve, reject) => {
            var fileArr = fileArr || []
            let files = fs.readdirSync(dir)
            let ext = ''
            for (let i of files) {
                let fileName = dir + i
                ext = path.extname(fileName)
                if (ext.match('jpg') || ext.match('png')) {
                    fileArr.push(fileName)
                }
            }
            let newFileArray = fileArr.map(item => {
                return item.match(/^.+public(\/.+)$/)[1]
            })
            obj.fileArray = newFileArray
            resolve(obj)
        })
    }

    /**
     * 递归遍历文件夹读取图片和html
     *
     * @param {String} dir 切图文件夹路径
     * @param {Array} fileArr 切图数组
     * @return {Array} fileArr 切图数组
     */
    function m_readDir2(obj) {
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
     * 循环上传阿里云
     *
     * @param {Array} imgArray 切图文件夹路径
     * @return {String} 上传后的图片url
     */
    function m_uploadToOss(fileList) {
        let uuid = uuidv1()
        let promises = fileList.map((img, index) => {
            return new Promise((resolve, reject) => {
                try {
                    var result = oss.put('static/pages/auto/' + currentDate + '/' + uuid + '/' + path.basename(img), img)
                    resolve(result)
                } catch (err) {
                    reject(err)
                }
            })

        })
        return Promise.all(promises)
    }
    function uploadImg(ctx) {
        return new Promise((resolve, reject) => {
            let form = new multiparty.Form({ uploadDir: './public/uploads/advance' })
            form.parse(ctx.req, function (err, fields, files) {
                if (err) {
                    reject()
                } else {
                    if(files && files.file && files.file.length) {
                        let img = path.join(__dirname, '../') + files.file[0].path  //当前切图的主体
                        let imgExt = path.extname(img) //获取图片后缀
                        let fileName = path.basename(img)//获取图片名
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
    var mobile = mobile || {}
    mobile.uuid = uuidv1()
    router.post('/upload1', async (ctx, next) => {  
        await uploadImg(ctx).then(img => {
            mobile.reqInfo.img = img
            return m_storeSize(mobile.reqInfo)
        }).then(obj => {
            return m_cropPosition(obj)
        }).then(obj => {
            return m_crop(obj)
        }).then(obj => {
            return m_readDir(obj[0])
        }).then(obj => {
            obj.pageUrl = ctx.origin + '/static-page-' + mobile.uuid
            obj.fileArrayOnline = obj.fileArray.map(item => {
                var arr = item.split('/')
                return arr[arr.length - 1]
            })
            console.log(mobile.reqInfo)
            router.get('/static-page-' + mobile.uuid, async (ctx, next) => {
                await ctx.render('template-mobile', {
                    obj
                })
            })
        }).then(() => { // 生成静态html并上传至阿里云
            return new Promise((resolve, reject) => {
                let pageName = Date.now() + '.html'
                let currentDir = mobile.reqInfo.fileArray[0].match(/^(.+)img-.+$/)[1]
                let htmlPath = path.join(__dirname, '../public/' + currentDir, pageName)
                let writeStream = fs.createWriteStream(htmlPath)
                request(mobile.reqInfo.pageUrl).pipe(writeStream)
                writeStream.on('finish', () => { // 写入成功
                    resolve(ctx.origin + currentDir + pageName)
                })
            })
        }).then(url => {
            return m_readDir2(mobile.reqInfo)
        }).then(fileList => {
            return m_uploadToOss(fileList)
        }).then(list => { // 跳转至线上地址
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