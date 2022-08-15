const mongoose = require('mongoose');
const { LogSchema } = require('./Log')
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
	},
	status: {
		type: String,
		default: 'none'
	},
	log: {
		type: [LogSchema],
		required: true
	}
})
module.exports = {
	ShippingDetailSchema,
}