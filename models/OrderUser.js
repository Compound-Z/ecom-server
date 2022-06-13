const mongoose = require('mongoose');
const OrderUserSchema = new mongoose.Schema({
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	name: {
		type: String,
		minlength: 5,
		maxlength: 50
	}
})
module.exports = mongoose.model("OrderUser", OrderUserSchema);