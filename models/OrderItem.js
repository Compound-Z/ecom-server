const mongoose = require('mongoose');
const OrderItemSchema = new mongoose.Schema({
	productId: {
		type: mongoose.Schema.ObjectId,
		ref: 'Product',
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
const OrderItemModel = mongoose.model("OrderItem", OrderItemSchema)
module.exports = {
	OrderItemModel,
	OrderItemSchema
}
