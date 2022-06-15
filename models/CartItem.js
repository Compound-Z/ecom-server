const mongoose = require('mongoose');
const CartItemSchema = new mongoose.Schema({
	productId: {
		type: mongoose.Schema.ObjectId,
		ref: 'ProductDetail',
		required: true
	},
	quantity: {
		type: Number,
		default: 1,
		min: 1,
		required: true
	}
})
const CartItemModel = mongoose.model("CartItem", CartItemSchema)
module.exports = {
	CartItemModel,
	CartItemSchema
}
