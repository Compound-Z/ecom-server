const mongoose = require('mongoose');
const { ItemSchema } = require('./Item');
const CartSchema = new mongoose.Schema({
	cartItems: [ItemSchema],
	userId: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: true,
	},
})
CartSchema.index({ userId: 1 });
module.exports = mongoose.model("Cart", CartSchema);