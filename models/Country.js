const mongoose = require('mongoose');

const CountrySchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Please provide name'],
		minlength: 2,
		maxlength: 50,
	},
	code: {
		type: String,
		unique: true,
		minlength: 1,
		maxlength: 3,
		required: [true, 'Please provide code'],
	},
});

module.exports = CountrySchema;
