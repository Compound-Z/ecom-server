const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

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
	productName: {
		type: String,
		trim: true,
		required: [true, 'Please provide product name'],
		maxlength: [100, 'Name can not be more than 100 characters'],
		minlength: [2, 'Product min length is 2'],
	},
	imageUrl: {
		type: String,
		default: '/uploads/example.jpeg',
	},
	reviewRef: {
		type: mongoose.Schema.ObjectId,
		ref: 'Review',
	},
},
	{ timestamps: true }
);
ReviewQueueSchema.index({ userId: 1 });

ReviewQueueSchema.plugin(mongoosePaginate)

const ReviewQueue = mongoose.model('ReviewQueue', ReviewQueueSchema);
module.exports = ReviewQueue