const mongoose = require('mongoose');
const Review = require('./Review') //todo: this should be removed when the app is done
const constant = require('../utils/constants');
const { Category, CategorySchema } = require('./Category');
const mongoosePaginate = require('mongoose-paginate-v2');
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const ProductSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			trim: true,
			required: [true, 'Please provide product name'],
			minlength: [5, 'Name must be longer than 5'],
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
		categoryRef: {
			type: mongoose.Schema.ObjectId,
			ref: 'Category',
			required: true,
			index: true,
		},
		stockNumber: {
			type: Number,
			required: true,
			default: 0,
		},
		saleNumber: {
			type: Number,
			required: true,
			default: 0,
		},
		weight: {
			/**Need this info for shipping api */
			type: Number,
			required: [true, 'Please provide product\'s weight'],
			default: 0,
		},
		averageRating: {
			type: Number,
			default: 0,
			required: true
		},
		numberOfRating: {
			type: Number,
			min: 0,
			default: 0,
			required: true
		},
		sumRating: {
			type: Number,
			min: 0,
			default: 0,
			required: true
		},
		sumPrevRating: {
			type: Number,
			min: 0,
			default: 0,
			required: true
		},
		shopId: {
			type: mongoose.Schema.ObjectId,
			ref: 'Shop',
			required: true,
			index: true,
		}
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
	await this.model('Review').deleteMany({ product: this._id })
})

ProductSchema.post('save', async function (next) {
	console.log('shopId', this.shopId)

	const shop = await this.model('Shop').findOne({ _id: this.shopId })
	console.log('shop', shop)
	shop.numberOfProduct = shop.numberOfProduct + 1

	let pos = null
	shop.categories.forEach((category, idx) => {
		if (category.categoryRef.equals(this.categoryRef)) {
			pos = idx
		}
	});
	if (pos == null) {
		shop.categories.push({
			categoryRef: this.categoryRef,
			numberOfProduct: 1
		})
	} else {
		shop.categories[pos].numberOfProduct = shop.categories[pos].numberOfProduct + 1
	}
	await shop.save()
})

ProductSchema.post('remove', async function (next) {
	const shop = await this.model('Shop').findOne({ _id: this.shopId })

	if (shop.numberOfProduct - 1 >= 0) shop.numberOfProduct = shop.numberOfProduct - 1

	let pos = null
	shop.categories.forEach((category, idx) => {
		if (category.categoryRef.equals(this.categoryRef)) {
			pos = idx
		}
	});
	if (pos != null) {
		if (shop.categories[pos].numberOfProduct - 1 > 0) {
			shop.categories[pos].numberOfProduct = shop.categories[pos].numberOfProduct - 1
		}
		else if (shop.categories[pos].numberOfProduct - 1 == 0) {
			//if there is no product in a category, remove  the category from shop
			shop.categories.splice(pos, 1)
		}
	}
	await shop.save()
})

ProductSchema.plugin(mongoosePaginate)
ProductSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('Product', ProductSchema)