const Order = require('../models/Order')
const Product = require('../models/Product')
const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const { Address } = require('../models/Address');
const ghnAPI = require('../services/ghn/ghnAPI');
const constant = require('../utils/constants')
const { deleteManyProductsInCart } = require('./cartController')
const createOrder = async (req, res) => {
	console.log('body: ', req.body)
	req.body.user = 'test_user_id'

	const userId = req.user.userId
	const orderItems = req.body.orderItems
	const paymentMethod = req.body.paymentMethod
	const addressItemId = req.body.addressItemId
	const note = req.body.note
	const shippingProvider = req.body.shippingProvider
	const shippingServiceId = req.body.shippingServiceId

	//get userInfo
	const user = await User.findOne({
		_id: userId
	}).select('name phoneNumber')

	if (orderItems.length == 0) throw new CustomError.BadRequestError('The order can not be empty')
	console.log('orderItems', orderItems)
	//get list ordered products
	let oidArr = []
	orderItems.forEach(orderItem => {
		oidArr.push(orderItem.productId)
	});
	console.log('oidArr:', oidArr)
	const products = await Product.find({
		_id: {
			$in: oidArr
		}
	}).select('_id sku name category price imageUrl quantity weight').lean()
	if (!products) throw new CustomError.InternalServerError('Error')

	//get address
	const address = await Address.findOne({
		userId,
		"addresses._id": addressItemId
	}, {
		addresses: {
			$elemMatch: {
				_id: addressItemId
			}
		}
	})
	if (!address) throw new CustomError.NotFoundError('Address does not exist')

	//get total weight and product cost
	let totalWeight = 0
	let totalProductCost = 0
	for (const [idx, item] of orderItems.entries()) {
		products[idx].quantity = item.quantity
		products[idx].productId = item.productId
		totalWeight += products[idx].weight * products[idx].quantity
		totalProductCost += products[idx].price * products[idx].quantity
	};
	console.log('products:', products)
	console.log('totalWeight:', totalWeight)
	console.log('totalProductCost:', totalProductCost)

	//get shipping fee
	const estimatedShippingFee = await ghnAPI.serviceAndCalculateFeeAPI.calculateFee(
		shippingServiceId,
		parseInt(process.env.SHOP_DISTRICT_ID),
		address.addresses[0].district.districtId,
		address.addresses[0].ward.code,
		totalWeight,
		constant.shipping.PACKAGE_LENGTH_DEFAULT,
		constant.shipping.PACKAGE_WIDTH_DEFAULT,
		constant.shipping.PACKAGE_HEIGHT_DEFAULT,
		totalProductCost
	)
	console.log('shipping fee:', estimatedShippingFee)
	const userOrder = createUserOrder(userId, user.name, user.phoneNumber)
	const billing = createBilling(totalProductCost, estimatedShippingFee, paymentMethod)
	const shippingDetails = createShippingDetails(shippingProvider)

	const order = await Order.create({
		user: userOrder,
		address: address.addresses[0],
		orderItems: products,
		billing,
		note,
		shippingDetails
	})
	if (!order) {
		throw new CustomError.InternalServerError('System Error: Can not create new order')
	}


	//delete product in cart after ordering
	await deleteManyProductsInCart(userId, orderItems)

	// if (paymentMethod === 'COD') {
	// 	res.status(StatusCodes.CREATED).json({
	// 		paymentMethod,
	// 		orders
	// 	})
	// } else {
	// 	createPaymentOrder(paymentMethod, products)
	// 	//handle: resturn and exception
	// }
	res.status(StatusCodes.CREATED).json(order)
}

//todo:
// const getMyOrders
// const getAllOrders
// const getOrderDetails
// const confirmOrder
// const cancelOrder

const getShippingFeeOptions = async (req, res) => {
	const userId = req.user.userId
	const addressItemId = req.body.addressItemId
	const cartItems = req.body.cartItems

	if (cartItems.length == 0) throw new CustomError.BadRequestError('No item to calculate fee')

	const address = await Address.findOne({
		userId,
		"addresses._id": addressItemId
	}, {
		addresses: {
			$elemMatch: {
				_id: addressItemId
			}
		}
	})
	if (!address) throw new CustomError.NotFoundError('Address does not exist')
	console.log('address ward', address.addresses[0].ward)
	const products = []
	for (const [idx, item] of cartItems.entries()) {
		const product = await Product.findOne({ _id: item.productId })
		if (!product) throw new CustomError.NotFoundError(`Produdct ${item.productId} does not exist`)
		product.quantity = cartItems[idx].quantity
		products.push(product)
	};

	let totalWeight = 0
	let totalProductCost = 0
	products.forEach(product => {
		totalWeight += product.weight * product.quantity
		totalProductCost += product.price * product.quantity
	});

	console.log('products:', products)
	console.log(`weight: ${totalWeight} cost: ${totalProductCost}`)
	console.log(`toDis: ${address.addresses[0].district.districtId} toWard: ${address.addresses[0].ward.code}`)
	console.log('xxx', constant.shipping.PACKAGE_LENGTH_DEFAULT)
	const feeOptions = await ghnAPI.serviceAndCalculateFeeAPI.calculateFeeOptions(
		parseInt(process.env.SHOP_DISTRICT_ID),
		address.addresses[0].district.districtId,
		address.addresses[0].ward.code,
		totalWeight,
		constant.shipping.PACKAGE_LENGTH_DEFAULT,
		constant.shipping.PACKAGE_WIDTH_DEFAULT,
		constant.shipping.PACKAGE_HEIGHT_DEFAULT,
		totalProductCost
	)

	res.status(StatusCodes.OK).json(feeOptions)
}

const createBilling = (totalProductCost, estimatedShippingFee, paymentMethod) => {
	return {
		subTotal: totalProductCost,
		shippingFee: estimatedShippingFee.total,
		estimatedShippingFee: estimatedShippingFee.total,
		//for now, payment method is commented out bcs system only support default payment method: COD
		// paymentMethod: paymentMethod
	}
}
const createShippingDetails = (shippingProvider) => {
	return {}
}
const createUserOrder = (userId, name, phoneNumber) => {
	return { userId, name, phoneNumber }
}
// getShippingDetails

module.exports = {
	createOrder,
	getShippingFeeOptions
}