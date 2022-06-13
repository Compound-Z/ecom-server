const mongoose = require('mongoose');
const ItemSchema = new mongoose.Schema({
	productDetailId: {
		type: mongoose.Schema.ObjectId,
		ref: 'ProductDetail',
		required: true
	},
	name: {
		type: String,
		trim: true,
		required: [true, 'Please provide product name'],
		maxlength: [100, 'Name can not be more than 100 characters'],
	},
	sku: {
		type: String,
		require: [true, "Please provide SKU"]
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
	quantity: {
		type: Number,
		default: 1,
		min: 1,
		required: true
	},
	weigt: {
		/**Need this info for shipping api */
		type: Number,
		require: [true, 'Please provide product\'s weight'],
		default: 0,
	},
})
const ItemModel = mongoose.model("Item", ItemSchema)
module.exports = {
	ItemModel,
	ItemSchema
}
