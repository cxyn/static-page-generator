const {readXlsx, uploadExcel} = require('../utils/excel')
module.exports = {
    read: async (ctx, next) => {
            let urlList = readXlsx(ctx.querystring)
            ctx.body = {
                code: 1,
                message: 'success',
                data: urlList
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