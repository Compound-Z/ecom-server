const mongoose = require('mongoose');
const { AddressItemSchema } = require('./AddressItem')
const AddressSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: true,
	},
	addresses: [
		AddressItemSchema
	],
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