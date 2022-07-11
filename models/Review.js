const mongoose = require('mongoose');
const CustomError = require('../errors');

const ReviewSchema = mongoose.Schema({
	userId: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: true,
	},
	userName: {
		type: String,
		minlength: 2,
		maxlength: 25,
		required: true
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
	rating: {
		type: Number,
		min: 1,
		max: 5,
		default: 5,
		required: [true, 'Please provide rating'],
	},
	content: {
		type: String,
		minlength: 12,
		maxlength: 250,
		required: [true, 'Please provide review content'],
	},
},
	{ timestamps: true }
);
ReviewSchema.index({ productId: 1 });

ReviewSchema.statics.calculateAverageRatingAddReview = async function (productId) {
	try {
		const product = await this.model('Product').findOne(
			{ _id: productId },
		);

		const newNumberOfRating = product.numberOfRating + 1
		const newRating = product.sumRating / newNumberOfRating + this.rating / newNumberOfRating
		const newSumPrevRating = product.sumRating
		const newSumRating = product.sumRating + this.rating

		product.rating = newRating
		product.numberOfRating = newNumberOfRating
		product.sumRating = newSumRating
		product.sumPrevRating = newSumPrevRating

		await product.save()
	} catch (error) {
		console.log(error);
		throw new CustomError.InternalServerError('System error while trying to calculate rating, please try again later!')
	}
};

ReviewSchema.statics.calculateAverageRatingUpdateReview = async function (productId) {
	try {
		const product = await this.model('Product').findOne(
			{ _id: productId },
		);

		const numberOfRating = product.numberOfRating
		const newRating = product.sumPrevRating / numberOfRating + this.rating / numberOfRating
		const newSumRating = product.sumPrevRating + this.rating

		product.rating = newRating
		product.sumRating = newSumRating

		await product.save()
	} catch (error) {
		console.log(error);
		throw new CustomError.InternalServerError('System error while trying to calculate rating, please try again later!')
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
