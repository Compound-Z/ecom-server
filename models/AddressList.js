const mongoose = require('mongoose');
const Address = require('./Address')
const AddressListSchema = new mongoose.Schema({
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	addresses: [
		Address
	],
})
module.exports = mongoose.model("AddressList", AddressListSchema);