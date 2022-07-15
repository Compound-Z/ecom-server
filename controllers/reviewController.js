const Product = require('../models/Product')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const constant = require('../utils/constants')
const ReviewQueue = require('../models/ReviewQueue')
const Review = require('../models/Review')
const addListProductsToReviewQueue = async (userId, order) => {
	if (!userId || !order) throw new CustomError.BadRequestError('user id and order can not be null')
	const orderItems = order.orderItems
	const products = []
	orderItems.forEach(item => {
		products.push({
			userId: userId,
			productId: item.productId,
			productName: item.name,
			imageUrl: item.imageUrl
		})
	});

	const result = await ReviewQueue.create(products)
	if (!result) throw new CustomError.InternalServerError('System error')
}

const getListReviewQueueProducts = async (req, res) => {
	const userId = req.user.userId
	const filter = req.body.filter
	const page = req.body.page || 1
	const pageSize = req.body.pageSize || 10

	let reviews = null
	const options = {
		sort: {
			updatedAt: -1
		},
		page: page,
		limit: pageSize,
	}
	if (filter === 'REVIEWED') {
		options.populate = { path: 'reviewRef', select: 'userName content rating isEdited' }
		reviews = await ReviewQueue.paginate({
			userId: userId,
			"reviewRef": {
				$ne: null
			},
		}, options)
	} else {
		reviews = await ReviewQueue.paginate({
			userId: userId,
			"reviewRef": null
		}, options)
	}

	console.log('reviews', reviews)

	if (!reviews) throw new CustomError.NotFoundError('Not found reviews')
	// console.log('order', orders)
	res.status(StatusCodes.OK).json(reviews)
}

const createReview = async (req, res) => {
	const { userId, name: userName } = req.user
	const { reviewQueueId, productId, rating, content } = req.body

	const product = await Product.findOne({ _id: productId })
	if (!product) throw new CustomError.NotFoundError(`Can not found product with id: ${productId}`)

	const productInQueue = await ReviewQueue.findOne({ _id: reviewQueueId, productId: product._id })
	if (!productInQueue) throw new CustomError.BadRequestError('You can not review this product, this might because you have not bought this product yet')
	if (productInQueue.reviewRef) throw new CustomError.BadRequestError('You can not re-review this product. Edit your review instead!')

	//only create new review if there is no reviewRef in that pending review
	const reviewObj = {
		userId,
		userName,
		productId,
		productName: product.name,
		imageUrl: product.imageUrl,
		rating,
		content
	}
	const newReview = await Review.create(reviewObj)
	if (!newReview) throw new CustomError.BadRequestError('System error, can not create new review.')
	//update newReview id to reviewQueue
	productInQueue.reviewRef = newReview._id
	const x = await productInQueue.save()

	res.status(StatusCodes.CREATED).json(newReview)
}

const updateReview = async (req, res) => {
	const { userId } = req.user
	const { rating, content } = req.body
	const reviewId = req.params.review_id

	const review = await Review.findOne({ userId, _id: reviewId })
	if (!review) throw new CustomError.NotFoundError(`Can not found review with id: ${reviewId}`)
	if (review.isEdited) throw new CustomError.NotFoundError(`This review has been edited before, can not edit again!`)
	const prevRating = review.rating
	const productId = review.productId

	const updatedReview = await Review.findOneAndUpdate(
		{
			userId,
			_id: reviewId
		},
		{
			rating,
			content,
			isEdited: true
		},
		{ new: true, runValidators: true }
	)

	if (!updatedReview) throw new CustomError.BadRequestError('System error, can not update this review.')

	//re-calculate rating after updating review
	await calculateAverageRatingUpdateReview(productId, rating, prevRating)

	res.status(StatusCodes.OK).json(updatedReview)
}

const calculateAverageRatingUpdateReview = async (productId, rating, preRating) => {
	try {
		const product = await Product.findOne(
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
}

const getListReviewsOfAProduct = async (req, res) => {
	const userId = req.user.userId
	const page = req.body.page || 1
	const pageSize = req.body.pageSize || 10
	const productId = req.params.product_id
	const starFilter = req.body.starFilter
	if (!productId) throw new CustomError.BadRequestError('productId is missing')

	const options = {
		sort: {
			updatedAt: -1
		},
		page: page,
		limit: pageSize,
	}
	const query = {
		userId,
		productId
	}
	if (starFilter) query.rating = starFilter
	const reviews = await Review.paginate(
		query,
		options
	)
	if (!reviews) throw new CustomError.NotFoundError('Not found reviews')
	res.status(StatusCodes.OK).json(reviews)
}

const getAllReviews = async (req, res) => {
	const page = req.body.page || 1
	const pageSize = req.body.pageSize || 10
	const starFilter = req.body.starFilter

	const options = {
		sort: {
			updatedAt: -1
		},
		page: page,
		limit: pageSize,
	}
	const query = {}
	if (starFilter) query.rating = starFilter

	const reviews = await Review.paginate(
		query,
		options
	)

	if (!reviews) throw new CustomError.NotFoundError('Not found reviews')
	res.status(StatusCodes.OK).json(reviews)
}

// const getReviewCounts = async (req, res) => {
// 	const productId = req.params.productId

// 	const options = {
// 		sort: {
// 			updatedAt: -1
// 		},
// 		page: page,
// 		limit: pageSize,
// 	}
// 	const query = {}
// 	if (starFilter) query.rating = starFilter

// 	const reviews = await Review.paginate(
// 		query,
// 		options
// 	)

// 	if (!reviews) throw new CustomError.NotFoundError('Not found reviews')
// 	res.status(StatusCodes.OK).json(reviews)
// }


module.exports = {
	addListProductsToReviewQueue,
	getListReviewQueueProducts,
	createReview,
	updateReview,
	getListReviewsOfAProduct,
	getAllReviews
}