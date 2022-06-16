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
	defaultAddressIndex: {
		type: Number,
		min: 0,
		require: true,
	},
})
module.exports = mongoose.model("Address", AddressSchema);