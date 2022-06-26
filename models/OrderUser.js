const mongoose = require('mongoose');
const validator = require('validator');

const OrderUserSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: true
	},
	name: {
		type: String,
		minlength: 2,
		maxlength: 50
	},
	phoneNumber: {
		type: String,
		required: [true, 'Please provide phone number'],
		validate: {
			validator: validator.isMobilePhone,
			message: 'Please provide valid mobile phone number',
		},
	},
})
module.exports = {
	OrderUserSchema,
}