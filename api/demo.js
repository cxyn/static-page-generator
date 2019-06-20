const query = require('../config/db');
async function showData (ctx, next) {
    // let rows = await query('SELECT * FROM menu');
    ctx.body = {
        code: 1,
        data: {
            name: 'colin'
        },
        msg: 'success'
    }
}
module.exports = {showData}