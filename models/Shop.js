const mongoose = require('mongoose');
const CategoryShopSchema = require('./CategoryShop')
const ShopSchema = new mongoose.Schema({
	//name should be in underscored form
	name: {
		type: String,
		minlength: 2,
		maxlength: 40,
		required: [true, 'Please provide shop name'],
	},
	imageUrl: {
		type: String,
		minlength: 5,
		maxlength: 250,
		required: [true, 'Please provide shop image url']
	},
	shippingShopId: {
		type: String
	},
	numberOfProduct: {
		type: Number,
		default: 0,
		min: 0,
		required: true
	},
	categories: {
		type: [CategoryShopSchema],
	}
}, { timestamps: true });

ShopSchema.index({ name: 'text' }, { unique: true });
const Shop = mongoose.model("Shop", ShopSchema)

module.exports = { Shop, ShopSchema }
