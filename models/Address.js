const mongoose = require('mongoose');
const { AddressItemSchema } = require('./AddressItem')
const AddressSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.ObjectId,
		required: true,
	},
	addresses: {
		type: [AddressItemSchema],
		ref: 'AddressItem'
	},
	defaultAddressId: {
		type: String,
		minlength: 0,
	},
})
const Address = mongoose.model("Address", AddressSchema);
module.exports = {
	AddressSchema,
	Address
}