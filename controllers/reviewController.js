const Order = require('../models/Order')
const Product = require('../models/Product')
const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const constant = require('../utils/constants')
const ReviewQueue = require('../models/ReviewQueue')
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

module.exports = {
	addListProductsToReviewQueue,
	getListReviewQueueProducts
}