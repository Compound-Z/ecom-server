const mongoose = require('mongoose');
const CategoryShopSchema = require('./CategoryShop')
const { AddressItemSchema } = require('./AddressItem')
const ShopSchema = new mongoose.Schema({
	//name should be in underscored form
	userId: {
		type: mongoose.Schema.ObjectId,
		ref: 'User'
	},
	name: {
		type: String,
		minlength: 2,
		maxlength: 40,
		required: [true, 'Please provide shop name'],
		unique: [true, 'This shop name has existed, please choose another name!']
	},
	imageUrl: {
		type: String,
		minlength: 5,
		maxlength: 250,
		required: [true, 'Please provide shop image url']
	},
	description: {
		type: String,
		required: [true, 'Please provide product description'],
		minlength: [25, 'Description need to be longer than 25 characters'],
		maxlength: [500, 'Description can not be more than 500 characters'],
	},
	shippingShopId: {
		type: String
	},
	addressItem: {
		type: AddressItemSchema,
		require: [true, 'Please provide address of your shop']
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

ShopSchema.index({ name: 'text' }, { unique: true, sparse: true });
module.exports = mongoose.model("Shop", ShopSchema)
