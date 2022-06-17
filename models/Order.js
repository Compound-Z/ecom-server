const mongoose = require('mongoose');
const { OrderItemSchema } = require('./OrderItem');
const { AddressSchema } = require('./Address');
const { OrderUserSchema } = require('./OrderUser');
const { BillingSchema } = require('./Billing');
const { ShippingDetailSchema } = require('./ShippingDetail');
const OrderSchema = new mongoose.Schema({
	user: OrderUserSchema,
	address: AddressSchema,
	orderItems: [OrderItemSchema],
	billing: BillingSchema,
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
	shippingDetails: ShippingDetailSchema
}, { timestamps: true })
module.exports = mongoose.model("Order", OrderSchema);