const mongoose = require('mongoose');
const { OrderItemSchema } = require('./OrderItem');
const { AddressItemSchema } = require('./AddressItem');
const { OrderUserSchema } = require('./OrderUser');
const { BillingSchema } = require('./Billing');
const { ShippingDetailSchema } = require('./ShippingDetail');
const mongoosePaginate = require('mongoose-paginate-v2');
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const OrderSchema = new mongoose.Schema({
	orderId: {
		type: String,
		unique: true,
		require: true,
	},
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
	shopRef: {
		type: mongoose.Schema.ObjectId,
		ref: 'Shop',
		required: true,
		index: true,
	}
}, { timestamps: true })
OrderSchema.plugin(mongoosePaginate)
OrderSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("Order", OrderSchema);