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
	}
})
const ShippingDetailModel = mongoose.model("ShippingDetail", ShippingDetailSchema);
module.exports = {
	ShippingDetailSchema,
	ShippingDetailModel
}