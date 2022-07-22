const mongoose = require('mongoose');

const CategoryShopSchema = new mongoose.Schema({
	categoryRef: {
		type: mongoose.Schema.ObjectId,
		ref: 'Category',
		required: true,
		index: true,
	},
	numberOfProduct: {
		type: Number,
		default: 0,
		min: 0,
		required: true
	},
}, { timestamps: true });

module.exports = CategoryShopSchema

