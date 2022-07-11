const mongoose = require('mongoose');

const ReviewQueueSchema = mongoose.Schema({
	userId: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: true,
	},
	productId: {
		type: mongoose.Schema.ObjectId,
		ref: 'Product',
		required: true,
	},
	reviewRef: {
		type: mongoose.Schema.ObjectId,
		ref: 'Review',
	},
},
	{ timestamps: true }
);
const ReviewQueue = mongoose.model('ReviewQueue', ReviewQueueSchema);
module.exports = ReviewQueue