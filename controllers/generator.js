module.exports = {
    // 首页
    init: async (ctx, next) => {
        await ctx.render('index', {})     
    }
}