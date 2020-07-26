const {readXlsx, uploadExcel} = require('../utils/excel')
module.exports = {
    read: async (ctx, next) => {
            let urlList = readXlsx(ctx.querystring)
            let list = urlList.filter(item => {
                if (item) {
                    return item
                }
            })
            ctx.body = {
                code: 1,
                message: 'success',
                data: list
            }
    },
    upload: async (ctx, next) => {
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
    }        
}