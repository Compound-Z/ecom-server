const mongoose = require('mongoose');
const CustomError = require('../errors');
const mongoosePaginate = require('mongoose-paginate-v2');

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
		minlength: [12, 'Review is too short, min length is 12 characters'],
		maxlength: [500, 'Review is too long, max length is 500 characters'],
		required: [true, 'Please provide review content'],
	},
	isEdited: {
		type: Boolean,
		default: false
	},
	prevRating: {
		type: Number,
		min: 1,
		max: 5
	}
},
	{ timestamps: true }
);
ReviewSchema.index({ productId: 1 });

ReviewSchema.statics.calculateAverageRatingAddReview = async function (productId, rating) {
	try {
		const product = await this.model('Product').findOne(
			{ _id: productId },
		);
		const newNumberOfRating = product.numberOfRating + 1
		const newRating = product.sumRating / newNumberOfRating + rating / newNumberOfRating
		const newSumPrevRating = product.sumRating
		const newSumRating = product.sumRating + rating


		product.rating = newRating
		product.numberOfRating = newNumberOfRating
		product.sumRating = newSumRating
		product.sumPrevRating = newSumPrevRating
		product.averageRating = newRating

		await product.save()
	} catch (error) {
		console.log(error);
		throw new CustomError.InternalServerError('System error while trying to calculate rating, please try again later!')
	}
};

ReviewSchema.statics.calculateAverageRatingUpdateReview = async function (productId, rating, preRating) {
	console.log('post', "calculateAverageRatingUpdateReview")

	try {
		const product = await this.model('Product').findOne(
			{ _id: productId },
		);
		const numberOfRating = product.numberOfRating
		const oldAverageRating = product.averageRating
		const delta = rating - preRating
		const newAverageRating = oldAverageRating + delta / numberOfRating
		const newSumRating = product.sumPrevRating + rating

		product.averageRating = newAverageRating
		product.sumRating = newSumRating

		const updatedProduct = await product.save()
		console.log('updated product', updatedProduct)
	} catch (error) {
		console.log(error);
		throw new CustomError.InternalServerError('System error while trying to calculate rating, please try again later!')
	}
};

ReviewSchema.post('save', async function () {
	console.log('post save', this)

	await this.constructor.calculateAverageRatingAddReview(this.productId, this.rating);
});

// ReviewSchema.pre('updateOne', async function () {
// 	console.log('data', data)
// 	this.prevRating = this.rating
// 	console.log('pre', this.prevRating)
// });
// ReviewSchema.post('findOneAndUpdate', async function (doc) {
// 	console.log('post update', "")
// 	await this.constructor.calculateAverageRatingUpdateReview(this.productId, this.rating, this.preRating);
// });
ReviewSchema.plugin(mongoosePaginate)
const Review = mongoose.model('Review', ReviewSchema);
module.exports = Review
