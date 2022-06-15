const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
	name: {
		type: String,
		minlength: 2,
		maxlength: 25,
		default: "Others",
		required: [true, 'Please provide category name'],
		unique: true,
	},
	imageUrl: {
		type: String,
		minlength: 5,
		maxlength: 250,
		required: [true, 'Please provide category image url']
	},
	numberOfProduct: {
		type: Number,
		default: 0,
		min: 0,
		required: true
	},
}, { timestamps: true });
CategorySchema.index({ name: 'text' }, { unique: true });
const Category = mongoose.model("Category", CategorySchema)

module.exports = Category