const mongoose = require('mongoose');
const { OrderItemSchema } = require('./OrderItem');
const { AddressItemSchema } = require('./AddressItem');
const { OrderUserSchema } = require('./OrderUser');
const { BillingSchema } = require('./Billing');
const { ShippingDetailSchema } = require('./ShippingDetail');
const OrderSchema = new mongoose.Schema({
	user: {
		type: OrderUserSchema,
		ref: 'OrderUser',
		required: true
	},
	address: {
		type: AddressItemSchema,
		ref: 'AddressItem',
		required: true
	},
	orderItems: {
		type: [OrderItemSchema],
		ref: 'OrderItem',
		required: true
	},
	billing: {
		type: BillingSchema,
		ref: 'Billing',
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
		ref: 'ShippingDetail',
		required: true
	},
	employee: {
		type: OrderUserSchema,
		ref: 'OrderUser'
	},
}, { timestamps: true })
module.exports = mongoose.model("Order", OrderSchema);