const mongoose = require('mongoose');

const CategoryShopSchema = new mongoose.Schema({
	name: {
		type: String,
		minlength: 2,
		maxlength: 40,
		default: "Others",
		required: [true, 'Please provide category name'],
	},
	numberOfProduct: {
		type: Number,
		default: 0,
		min: 0,
		required: true
	},
}, { timestamps: true });

module.exports = CategoryShopSchema

