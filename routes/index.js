module.exports = (router) => {
    router.get('/', async(ctx, next) => {
        await ctx.render('index', {

        })
    })
    const fs = require('fs')
    const gm = require('gm')
    const path = require('path')
    const upload = require("../utils/upload")
    const removeAll = require("../utils/removeAll")
    const oss = require("../utils/oss")
    const request = require('request')
    

    // 获取图片尺寸存入对象
    function getSize(item) {
        return new Promise((resolve, reject) => {
            gm(item).size((err, size) => {
                if (err) {
                    console.log(err)
                    reject()
                    return
                }
                console.log('第一步：获取尺寸')
                resolve(size)
            })
        })
    } 

    // 存储每张切图的高度
    async function storeSize(size, baseHight) {
        console.log('第二步：存储尺寸')
        let width = size.width
        let height = size.height
        let areaCount = Math.ceil(size.height / baseHight) //计算出的切图数量
        let lastHeight = size.height % baseHight           //最后一块切图的高度
        let heightArray = []                                      //存储每张切图的高度
        let i = 0
        // console.log('areaCount', areaCount, 'lastHeight', lastHeight)
        for(i; i < areaCount; i++) {
            if(lastHeight) {
                if(i === areaCount - 1) {
                    heightArray.push(lastHeight)
                }else {
                    heightArray.push(baseHight)
                }
            }else {
                heightArray.push(baseHight)
            }
        }
        return await {width, heightArray}
    } 

    // 计算切图坐标
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
            },0)
            console.log('第三步：存储位置信息')
            resolve(positionArray)
        })
    }

    //切图api调用，累加实现计算坐标位置
    function crop(imgObject, positionArr) {    
        let cropDir = path.join(__dirname, '../public/uploads/') + 'crop-' + Date.now() +'/'
        try{
            fs.statSync(cropDir)
            console.log('切图目录已存在')
          }catch(e){
            fs.mkdir(cropDir, (err) => {
              if(err) {
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
                .write(cropDir + 'crop-' + idx + '.png', (err, out) => {
                    if(err) {
                        reject(err)
                    }
                    resolve(cropDir)
                })
            })
        })
        console.log('第四步：切图')
        return Promise.all(promises)
    }

    // 遍历文件夹下面的图片
    let readDir = function scanFiles(dir, fileArr) {
        console.log('第五步：读取切图')
        if(!dir) return
        return new Promise((resolve, reject) => {
            var fileArr = fileArr || []
            let files = fs.readdirSync(dir)
            for(let i of files) {
                let fileName = dir + i
                if(fs.statSync(fileName).isDirectory()) {
                    scanFiles(fileName, fileArr)
                }else {
                    if(fileName.split('.')[1] == 'jpg' || fileName.split('.')[1] == 'png') {
                        fileArr.push(fileName)
                    }
                }
            }
            resolve(fileArr)
        })
    }

    // 循环上传阿里云
    function uploadToOss(imgArray) {
        console.log('第六步：上传切图至阿里云')
        let promises = imgArray.map((img, index) => {
            return new Promise((resolve, reject) => {
                try {
                    var result = oss.put('static/images/crop-' + Date.now() + index + '.png', img)
                    resolve(result)
                }catch (err) {
                    reject(err)
                }
            })
            
        })
        return Promise.all(promises)
    }

    // 路由
    router.post('/upload', upload.single('file'), async (ctx, next) => {
        // console.log(JSON.stringify(ctx.req.file));
        let pageInfo = {
            title: '静态页面',
            keywords: '关键词',
            description: '描述'
        }
        let baseHight = 800                   //每块切图的默认基准高度
        let width = 0, height = 0             //设计稿的宽高
        let img = path.join(__dirname, '../') + ctx.req.file.path  //当前切图的主体
        let fileName = ctx.req.file.fileName

        await getSize(img)
        
        .then(size => { // 获取图片尺寸存入数据
            return storeSize(size, baseHight)
        })
        .then(data => { // 计算裁切坐标存入数据
            return cropPosition(data.heightArray, data.width)
        })
        .then(positionArray => { // 切图操作
            return crop(img, positionArray)
        })
        .then(dir => { // 读取切图文件夹所有文件
            return readDir(dir[0])
        })
        .then(fileArray => { // 上传至阿里云
            return uploadToOss(fileArray)
        })
        .then(urlArray => { //路由注入
            router.get('/static-page', async(ctx, next) => {
                await ctx.render('template-mobile', {
                    pageInfo,
                    urlArray
                })
            })
        })
        .then(() => { // 生成静态html并上传至阿里云
            return new Promise((resolve, reject) => {
                let todayDir = String(new Date().getFullYear()) + String(new Date().getMonth() + 1) + String(new Date().getDate())
                let htmlPath = path.join(__dirname, '../public/uploads/', todayDir + '/', Date.now() + '.html')
                let writeStream = fs.createWriteStream(htmlPath)
                request(ctx.origin + '/static-page').pipe(writeStream)
                writeStream.on('finish', () => { // 写入成功
                    resolve(oss.put('static/pages/' + Date.now() + '.html', htmlPath))
                })
            })
        })
        .then(urlObj => { // 跳转至线上地址
            let dir = path.join(__dirname, '../public/uploads/')
            removeAll(dir)
            ctx.redirect(urlObj.url)
        })
        ctx.body = 'success'
    })
    
}