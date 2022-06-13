const mongoose = require('mongoose');
const Item = require('./Item');
const CartSchema = new mongoose.Schema({
	cartItems: [
		Item
	]
})
module.exports = mongoose.model("Cart", CartSchema);