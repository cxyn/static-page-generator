let dateObj = new Date()
let currentDate = dateObj.getFullYear().toString() + (dateObj.getMonth() + 1).toString().padStart(2, '0') + dateObj.getDate().toString().padStart(2, '0')
module.exports = currentDate