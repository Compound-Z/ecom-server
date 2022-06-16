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
})
module.exports = mongoose.model("Address", AddressSchema);