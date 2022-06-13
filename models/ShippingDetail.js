const mongoose = require('mongoose');
const ShippingDetailSchema = new mongoose.Schema({
	shippingProvider: {
		type: String,
		enum: [
			'GHN',
			'GHTK',
		],
		default: 'GHTK'
	},
	shippingOrderId: {
		type: String,
		require: true
	}
})
module.exports = mongoose.model("ShippingDetail", ShippingDetailSchema);