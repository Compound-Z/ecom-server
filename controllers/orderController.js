const Order = require('../models/Order')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');

const createOrder = async (req, res) => {
	console.log('body: ', req.body)
	req.body.user = 'test_user_id'

	const { name, imageUrl, numberOfProduct } = req.body

	const category = await Category.create({
		name, imageUrl, numberOfProduct
	})

	res.status(StatusCodes.CREATED).json(category)
}