const mongoose = require('mongoose');

const ProductDetailSchema = new mongoose.Schema({
	productId: {
		type: mongoose.Schema.ObjectId,
		ref: 'Product',
		required: true,
		unique: true,
	},
	unit: {
		type: String,
		minlength: 2,
		maxlength: 25,
	},
	brandName: {
		type: String,
		minlength: 2,
		maxlength: 25,
		require: true,
	},
	origin: {
		type: String,
		minlength: 2,
		maxlength: 25,
	},
	imageUrls: [
		{
			type: String
		}
	],
	numOfReviews: {
		type: Number,
		default: 0,
	},
	description: {
		type: String,
		required: [true, 'Please provide product description'],
		minlength: [50, 'Description need to be longer than 50 characters'],
		maxlength: [2500, 'Description can not be more than 2500 characters'],
	},
	shopId: {
		type: mongoose.Schema.ObjectId,
		ref: 'Shop',
		required: true,
	}
	// featured: {
	// 	type: Boolean,
	// 	default: false,
	// },
	// freeShipping: {
	// 	type: Boolean,
	// 	default: false,
	// },
	// saleOffPercentage: {
	// 	type: Number,
	// 	default: 0
	// },
	// user: {
	// 	type: mongoose.Types.ObjectId,
	// 	ref: 'User',
	// 	required: true,
	// },
}, { timestamps: true }
);
ProductDetailSchema.index({ productId: 1 }, { unique: true });

module.exports = mongoose.model('ProductDetail', ProductDetailSchema)
