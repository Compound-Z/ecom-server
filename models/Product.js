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
		sku: {
			type: String,
			required: [true, "Please provide SKU"]
		},
		isSaling: {
			type: Boolean,
			default: true,
		},
		price: {
			type: Number,
			required: [true, 'Please provide product price'],
			default: 0,
		},
		imageUrl: {
			type: String,
			default: '/uploads/example.jpeg',
		},
		category: {
			/**This is category name, not categoryId. Category name field will be
			 * indexed in order to have covered query on category field.
			 */
			type: String,
			required: [true, 'Please provide product category'],
		},
		saleNumber: {
			type: Number,
			required: true,
			default: 0,
		},
		averageRating: {
			type: Number,
			default: -1,
		},
		weight: {
			/**Need this info for shipping api */
			type: Number,
			required: [true, 'Please provide product\'s weight'],
			default: 0,
		},
	},
	{ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
ProductSchema.index({ category: 'text', name: 'text' }, { weights: { name: 7, category: 3 } });

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