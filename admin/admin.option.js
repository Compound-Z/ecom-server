const AdminJS = require('adminjs')
const Order = require('../models/Order')
const User = require('../models/User')
const options = {
	databases: [User],
	rootPath: '/admin'
}
module.exports = options