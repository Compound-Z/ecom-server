const mongoose = require('mongoose');
const ShippingDetailSchema = new mongoose.Schema({
	weight: {
		type: Number,
		required: true,
		default: 0,
	},
	shippingProvider: {
		type: String,
		enum: [
			'GHN',
			'GHTK',
		],
		default: 'GHN'
	},
	shippingServiceId: {
		type: Number,
		required: true,
	},
	shippingOrderCode: {
		type: String,
	},
	transType: {
		type: String,
	},
	mainServiceFee: {
		type: Number,
	},
	insurance: {
		type: Number
	},
	totalFee: {
		type: Number
	},
	expectedDeliveryTime: {
		type: String
	}
})
module.exports = {
	ShippingDetailSchema,
}