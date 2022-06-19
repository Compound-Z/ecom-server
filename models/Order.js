const mongoose = require('mongoose');
const { OrderItemSchema } = require('./OrderItem');
const { AddressItemSchema } = require('./AddressItem');
const { OrderUserSchema } = require('./OrderUser');
const { BillingSchema } = require('./Billing');
const { ShippingDetailSchema } = require('./ShippingDetail');
const OrderSchema = new mongoose.Schema({
	user: {
		type: OrderUserSchema,
		required: true
	},
	address: {
		type: AddressItemSchema,
		required: true
	},
	orderItems: {
		type: [OrderItemSchema],
		required: true
	},
	billing: {
		type: BillingSchema,
		required: true
	},
	status: {
		type: String,
		enum: [
			"PENDING",
			"PROCESSING",
			"PAID",
			"CONFIRMED",
			"CANCELED",
			"DELIVERYING",
			"DELIVERED",
			"RECEIVED"
		],
		default: "PENDING",
		required: true
	},
	note: {
		type: String,
		maxlength: 250
	},
	shippingDetails: {
		type: ShippingDetailSchema,
		required: true
	},
	employee: OrderUserSchema,
}, { timestamps: true })
module.exports = mongoose.model("Order", OrderSchema);