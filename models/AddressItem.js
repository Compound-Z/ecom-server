const mongoose = require('mongoose');
const ProvinceSchema = mongoose.Schema({
	provinceId: {
		type: Number,
		min: 0,
		require: true,
	},
	name: {
		type: String,
		required: true,
	},
	code: {
		type: String,
		required: true,
	},
})

const DistrictSchema = mongoose.Schema({
	districtId: {
		type: Number,
		min: 0,
		require: true,
	},
	provinceId: {
		type: Number,
		min: 0,
		require: true,
	},
	name: {
		type: String,
		required: true,
	},
	code: {
		type: String,
		required: true,
	},
})
const WardSchema = mongoose.Schema({
	districtId: {
		type: Number,
		min: 0,
		require: true,
	},
	name: {
		type: String,
		required: true,
	},
	code: {
		type: String,
		required: true,
	},
})
const AddressItemSchema = new mongoose.Schema({
	receiverName: {
		type: String,
		minlength: 2,
		maxlength: 25,
		required: true
	},
	receiverPhoneNumber: {
		type: String,
		// match: "^(0|\+84?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$",
		required: true
	},
	province: {
		type: ProvinceSchema,
	},
	district: {
		type: DistrictSchema,
	},
	ward: {
		type: WardSchema,
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

module.exports = { AddressItemSchema }