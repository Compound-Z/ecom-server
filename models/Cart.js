const mongoose = require('mongoose');
const { ItemSchema } = require('./Item');
const CartSchema = new mongoose.Schema({
	cartItems: [ItemSchema]
})
module.exports = mongoose.model("Cart", CartSchema);