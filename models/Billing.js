const mongoose = require('mongoose');
const Item = require('./Item');
const BillingSchema = new mongoose.Schema({
	subTotal: {
		type: Number,
		required: true
	},
	shippingFee: {
		type: Number,
		required: true
	},
	estimatedShippingFee: {
		type: Number,
		required: true,
	},
	paymentMethod: {
		type: String,
		enum: [
			"ZALOPAY",
			"VNPAY",
			"MOMO",
			"COD"
		],
		default: "COD",
		required: true
	}
})
const BillingModel = mongoose.model("Billing", BillingSchema);
module.exports = {
	BillingSchema,
	BillingModel
}