// const mongoose = require('mongoose');
// const { resolve } = require('fs');
// const read = require('../utils/fileReadHelper')
// const bootstrap = () => {
// 	mongoose.connection.db.listCollections({ name: 'provinces' })
// 		.next(function (error, collection) {
// 			if (!collection) {
// 				uploadDataToDB('../static_data/povince_ghn.js')
// 			}
// 		})
// }

// const uploadDataToDB = (relativePath) => {
// 	const absolutePath = resolve(relativePath)
// 	const provinces = read(absolutePath)

// }