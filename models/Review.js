const mongoose = require('mongoose');

const ReviewSchema = mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.ObjectId,
			ref: 'User',
			required: true,
			sparse: true,
		},
		userName: {
			type: String,
			required: [true, 'Please provide userName'],
			minlength: 2,
			maxlength: 50,
		},
		rating: {
			type: Number,
			min: 1,
			max: 5,
			required: [true, 'Please provide rating'],
		},
		content: {
			type: String,
			required: [true, 'Please provide review text'],
		},
	},
	{ timestamps: true }
);
ReviewSchema.index({ userId: 1 }, { unique: true });

ReviewSchema.statics.calculateAverageRating = async function (productId) {
	const result = await this.aggregate([
		{ $match: { product: productId } },
		{
			$group: {
				_id: null,
				averageRating: { $avg: '$rating' },
				numOfReviews: { $sum: 1 },
			},
		},
	]);

	try {
		await this.model('Product').findOneAndUpdate(
			{ _id: productId },
			{
				averageRating: Math.ceil(result[0]?.averageRating || 0),
				numOfReviews: result[0]?.numOfReviews || 0,
			}
		);
	} catch (error) {
		console.log(error);
	}
};

ReviewSchema.post('save', async function () {
	await this.constructor.calculateAverageRating(this.product);
});

ReviewSchema.post('remove', async function () {
	await this.constructor.calculateAverageRating(this.product);
});
const ReviewModel = mongoose.model('Review', ReviewSchema);
module.exports = {
	ReviewModel,
	ReviewSchema
}
