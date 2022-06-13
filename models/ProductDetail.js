const mongoose = require('mongoose');
const Review = require('./Review') //todo: this should be removed when the app is done

const ProductDetailSchema = new mongoose.Schema({
	description: {
		type: String,
		required: [true, 'Please provide product description'],
		minlength: [50, 'Description need to be longer than 50 characters'],
		maxlength: [2500, 'Description can not be more than 1000 characters'],
	},
	unit: {
		type: String,
		minlength: 2,
		maxlength: 25,
	},
	weigt: {
		/**Need this info for shipping api */
		type: Number,
		require: [true, 'Please provide product\'s weight'],
		default: 0,
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
		Review
	],

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
module.exports = mongoose.model('ProductDetail', ProductDetailSchema)
