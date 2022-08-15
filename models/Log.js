const mongoose = require('mongoose');
const LogSchema = new mongoose.Schema({
	status: {
		type: String,
		required: true,
	},
	updated_date: {
		type: String,
		required: true,
	},
})
module.exports = {
	LogSchema,
}