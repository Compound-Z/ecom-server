const mongoose = require('mongoose');

const ProvinceSchema = new mongoose.Schema({
	ProvinceID: {
		type: Number,
		min: 0,
		require: true,
	},
	ProvinceName: {
		type: String,
		minlength: 2,
		maxlength: 50,
		required: [true, 'Please provide Province name'],
		unique: true,
	},
	Code: {
		type: String,
		maxlength: 50,
		required: [true, 'Please provide Province code'],
		unique: true,
	},
	RegionID: {
		type: Number,
		min: 0,
		require: true,
	},
}, { timestamps: true });
const Province = mongoose.model("Province", ProvinceSchema)
module.exports = Province