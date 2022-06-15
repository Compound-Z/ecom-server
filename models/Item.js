const mongoose = require('mongoose');
const ItemSchema = new mongoose.Schema({
	productDetailId: {
		type: mongoose.Schema.ObjectId,
		ref: 'ProductDetail',
		required: true
	},
	sku: {
		type: String,
		require: [true, "Please provide SKU"],
	},
	name: {
		type: String,
		trim: true,
		required: [true, 'Please provide product name'],
		maxlength: [100, 'Name can not be more than 100 characters'],
	},
	price: {
		type: Number,
		required: [true, 'Please provide product price'],
	},
	imageUrl: {
		type: String,
		required: [true, 'Please provide image url'],
		// default: '/uploads/example.jpeg',
	},
	quantity: {
		type: Number,
		default: 1,
		min: 1,
		required: true
	},
	weight: {
		/**Need this info for shipping api */
		type: Number,
		require: [true, 'Please provide product\'s weight'],
	},
})
const ItemModel = mongoose.model("Item", ItemSchema)
module.exports = {
	ItemModel,
	ItemSchema
}
