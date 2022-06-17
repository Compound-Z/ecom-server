const mongoose = require('mongoose');
const OrderUserSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: true
	},
	name: {
		type: String,
		minlength: 5,
		maxlength: 50
	}
})
const OrderUserModel = mongoose.model("OrderUser", OrderUserSchema);
module.exports = {
	OrderUserSchema,
	OrderUserModel
}