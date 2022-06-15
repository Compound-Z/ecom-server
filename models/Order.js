const mongoose = require('mongoose');
const { OrderItemSchema } = require('./OrderItem');
const Address = require('./Address');
const OrderUser = require('./OrderUser');
const Billing = require('./Billing');
const ShippingDetail = require('./ShippingDetail');
const OrderSchema = new mongoose.Schema({
	user: OrderUser,
	address: Address,
	orderItems: [OrderItemSchema],
	billing: Billing,
	status: {
		type: String,
		enum: [
			"NOT_PAID",
			"PAID",
			"CONFIRMED",
			"CANCELED",
			"DELIVERYING",
			"DELIVERED",
			"RECEIVED"
		],
		default: "NOT_PAID",
		required: true
	},
	note: {
		type: String,
		maxlength: 250
	},
	shippingDetails: ShippingDetail
}, { timestamps: true })
module.exports = mongoose.model("Order", OrderSchema);