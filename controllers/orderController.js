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
const getMyOrders = async (req, res) => {
	const userId = req.user.userId
	const statusFilter = req.body.statusFilter
	let orders
	if (statusFilter) {
		orders = await Order.find({
			"user.userId": userId,
			"status": statusFilter,
		}).select('_id orderItems billing status')
	} else {
		orders = await Order.find({
			"user.userId": userId,
		}).select('_id orderItems billing status')
	}
	if (!orders) throw new CustomError.NotFoundError('Not found orders')
	res.status(StatusCodes.OK).json(orders)
}

//admin only
const getAllOrders = async (req, res) => {
	const statusFilter = req.body.statusFilter
	let orders
	if (statusFilter) {
		orders = await Order.find({
			"status": statusFilter,
		}).select('_id orderItems billing status')
	} else {
		orders = await Order.find({}).select('_id orderItems billing status')
	}
	if (!orders) throw new CustomError.NotFoundError('Not found orders')
	res.status(StatusCodes.OK).json(orders)
}

const getOrderDetails = async (req, res) => {
	const userId = req.user.userId
	const orderId = req.params.order_id
	const order = await Order.findOne({
		"user.userId": userId,
		_id: orderId
	})
	console.log('order:', order)
	if (!order) throw new CustomError.NotFoundError('Order does not exist')
	res.status(StatusCodes.OK).json(order)
}

const updateOrderStatus = async (req, res) => {
	const status = req.body.status
	switch (status) {
		case 'CONFIRMED':
			await confirmOrder(req, res)
			break;
		case 'PROCESSING':
			await startProcessingOrder(req, res)
			break;
		case 'CANCELED':
			await cancelOrder(req, res)
			break;
		default:
			throw new CustomError.BadRequestError('Status undefined!')
	}
}

//only admin
const startProcessingOrder = async (req, res) => {
	const orderId = req.params.order_id
	const userId = req.user.userId
	const user = await User.findOne({
		"user.userId": userId,
		_id: userId
	})
	if (!user) throw CustomError.NotFoundError('User does not exist')
	console.log('orderId', orderId)
	const order = await Order.findOneAndUpdate({
		_id: orderId
	}, {
		$set: {
			status: 'PROCESSING',
			"employee.userId": userId,
			"employee.name": user.name,
			"employee.phoneNumber": user.phoneNumber
		}
	}, { new: true, runValidators: true })
	if (!order) {
		console.log('order', order)
		throw CustomError.NotFoundError('Order does not exist')
	}

	//todo: notify user/or can do caching to compare old data vs new data, so that the app can show red noti

	res.status(StatusCodes.OK).json(order)

}
//admin only
const confirmOrder = async (req, res) => {
	/**Confirming means the shop has packed the order and transfer to shipping provider */
	const userId = req.user.userId
	const orderId = req.params.order_id

	const user = await User.findOne({
		_id: userId
	})
	if (!user) throw CustomError.NotFoundError('User does not exist')

	const order = await Order.findOneAndUpdate({
		"user.userId": userId,
		_id: orderId
	}, {
		$set: {
			status: 'CONFIRMED',
			"employee.userId": userId,
			"employee.name": user.name,
			"employee.phoneNumber": user.phoneNumber
		}
	}, { new: true, runValidators: true })
	if (!order) throw CustomError.NotFoundError('Order does not exist')


	//todo: create a shipping order
	//todo: notify user
	res.status(StatusCodes.OK).json(order)
}
//admin only
const cancelOrder = async (req, res) => {
	//only cancel if the order status is pending, processing
	const userId = req.user.userId
	const orderId = req.params.order_id

	const user = await User.findOne({
		_id: userId
	})
	if (!user) throw CustomError.NotFoundError('User does not exist')

	const order = await Order.findOne({
		_id: orderId,
		"user.userId": userId,

	})
	if (!order) throw new CustomError.NotFoundError('Order does not exist')

	if (constant.cancelableStatus.includes(order.status)) {
		//only cancel if the status is pending or processing
		order.status = 'CANCELED'
		order.employee.userId = userId
		order.employee.name = user.name
		order.employee.phoneNumber = user.phoneNumber
	} else {
		throw new CustomError.BadRequestError('Can not update order status, the order has already been confirmed!')
	}
	const canceledOrder = await order.save()
	//todo: notify user
	res.status(StatusCodes.OK).json(canceledOrder)
}

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
	getShippingFeeOptions,
	getMyOrders,
	getAllOrders,
	getOrderDetails,
	updateOrderStatus,
}