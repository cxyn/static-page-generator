module.exports = async (ctx, next) => {
    try {
        await next()
        // 处理响应结果
        // 如果直接写入在 body 中，则不作处理
        // 如果写在 ctx.body 为空，则使用 state 作为响应
        ctx.body = ctx.body ? ctx.body : {
            code: ctx.state.code !== undefined ? ctx.state.code : 0,
            data: ctx.state.data !== undefined ? ctx.state.data : {}
        }
    } catch (e) {
        // catch 住全局的错误信息
        console.log('Catch Error: %o', e)
        ctx.status = 200
        ctx.body = {
            code: -1,
            error: e && e.message ? e.message : e.toString()
        }
    }
}

// const { logger } = require('./logger')
// // 这个middleware用于将ctx.result中的内容最终回传给客户端
// const responseHandler = (ctx) => {
//   if (ctx.result !== undefined) {
//     ctx.type = 'json'
//     ctx.body = {
//       code: 200,
//       msg: ctx.msg || '',
//       data: ctx.result
//     }
//   }
// }

// // 这个middleware处理在其它middleware中出现的异常,我们在next()后面进行异常捕获，出现异常直接进入这个中间件进行处理
// const errorHandler = (ctx, next) => {
//   return next().catch(err => {
//     if (err.code == null) {
//       logger.error(err.stack)
//     }
//     ctx.body = {
//       code: err.code || -1,
//       data: null,
//       msg: err.message.trim()
//     }
//     // 保证返回状态是 200
//     ctx.status = 200 
//     return Promise.resolve()
//   })
// }

// module.exports = {
//   responseHandler,
//   errorHandler
// }