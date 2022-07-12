const Order = require('../models/Order')
const Product = require('../models/Product')
const User = require('../models/User')
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

	if (!reviews) throw new CustomError.NotFoundError('Not found reviews')
	// console.log('order', orders)
	res.status(StatusCodes.OK).json(reviews)
}

const createReview = async (req, res) => {
	const { userId, name: userName } = req.user
	const { reviewQueueId, productId, rating, content } = req.body

	const product = await Product.findOne({ _id: productId })
	if (!product) throw new CustomError.NotFoundError(`Can not found product with id: ${productId}`)

	const productInQueue = await ReviewQueue.findOne({ _id: reviewQueueId })
	if (!productInQueue) throw new CustomError.BadRequestError('You can not review this product, this might because you have not bought this product yet')
	if (productInQueue.reviewRef) throw new CustomError.BadRequestError('This product has already been reviewed!')

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
module.exports = {
	addListProductsToReviewQueue,
	getListReviewQueueProducts,
	createReview
}