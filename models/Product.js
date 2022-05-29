const mongoose = require('mongoose');
const Review = require('./Review') //todo: this should be removed when the app is done
const constant = require('../utils/constants')

const ProductSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			trim: true,
			required: [true, 'Please provide product name'],
			maxlength: [100, 'Name can not be more than 100 characters'],
		},
		price: {
			type: Number,
			required: [true, 'Please provide product price'],
			default: 0,
		},
		description: {
			type: String,
			required: [true, 'Please provide product description'],
			maxlength: [1000, 'Description can not be more than 1000 characters'],
		},
		image: {
			type: String,
			default: '/uploads/example.jpeg',
		},
		category: {
			type: String,
			required: [true, 'Please provide product category'],
			enum: constant.categories,
		},
		brand: {
			type: String,
			required: [true, 'Please provide brand'],
			enum: {
				values: constant.brands,
				message: '{VALUE} is not supported',
			},
			default: 'none',
		},
		featured: {
			type: Boolean,
			default: false,
		},
		freeShipping: {
			type: Boolean,
			default: false,
		},
		saleOfPercentage: {
			type: Number,
			default: 0
		},
		inventory: {
			type: Number,
			required: true,
			default: 5000,
		},
		saleNumber: {
			type: Number,
			required: true,
			default: 0,
		},
		averageRating: {
			type: Number,
			default: 0,
		},
		numOfReviews: {
			type: Number,
			default: 0,
		},
		user: {
			type: mongoose.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// create virtual from Product -> Review: 1 - n
ProductSchema.virtual('reviews', {
	ref: 'Review',
	localField: '_id',
	foreignField: 'product',
	justOne: false,
});

ProductSchema.pre('remove', async function (next) {
	try {
		await this.model('Review').deleteMany({ product: this._id })
	} catch (error) {
		console.log('error: ', error)
	}
})


module.exports = mongoose.model('Product', ProductSchema)