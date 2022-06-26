const mongoose = require('mongoose');
const CartItemSchema = new mongoose.Schema({
	productId: {
		type: mongoose.Schema.ObjectId,
		ref: 'Product',
		required: true
	},
	quantity: {
		type: Number,
		default: 1,
		min: 1,
		required: true
	}
})
module.exports = {
	CartItemSchema
}
