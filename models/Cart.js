const mongoose = require('mongoose');
const { CartItemSchema } = require('./CartItem');
const CartSchema = new mongoose.Schema({
	cartItems: {
		type: [CartItemSchema],
		required: true,
	},
	userId: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: true,
	},
})
CartSchema.index({ userId: 1 });
module.exports = mongoose.model("Cart", CartSchema);