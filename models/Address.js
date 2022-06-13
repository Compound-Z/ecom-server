const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
	isDefaultAddress: {
		type: Boolean,
		default: false,
		required: true
	},
	receiverName: {
		type: String,
		minlength: 2,
		maxlength: 25,
		required: true
	},
	receiverPhoneNumber: {
		type: String,
		match: "^(0|\+84?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$",
		required: true
	},
	province: {
		type: String,
		minlength: 2,
		maxlength: 25,
		required: true
	},
	district: {
		type: String,
		minlength: 2,
		maxlength: 25,
		required: true
	},
	village: {
		type: String,
		minlength: 2,
		maxlength: 25,
		required: true
	},
	detailedAddress: {
		type: String,
		minlength: 5,
		maxlength: 50,
		required: true
	},
	addressType: {
		type: String,
		enum: [
			"HOME",
			"OFFICE"
		],
		default: "HOME",
		required: true
	}
})
module.exports = mongoose.model("Address", AddressSchema);