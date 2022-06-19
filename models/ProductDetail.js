const mongoose = require('mongoose');
const { ReviewSchema } = require('./Review') //todo: this should be removed when the app is done

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
	reviews: [
		ReviewSchema
	],
	description: {
		type: String,
		required: [true, 'Please provide product description'],
		minlength: [50, 'Description need to be longer than 50 characters'],
		maxlength: [2500, 'Description can not be more than 2500 characters'],
	},
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
