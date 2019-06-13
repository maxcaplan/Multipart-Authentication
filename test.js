const fs = require('fs')
const ncp = require('ncp')

ncp.limit = 20

ncp("./randomImages", "./users/Max Caplan/validation/not")
// fs.copyFileSync("randomImages/")