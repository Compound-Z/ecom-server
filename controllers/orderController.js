const Order = require('../models/Order')
const Product = require('../models/Product')
const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const { Address } = require('../models/Address');
const ghnAPI = require('../services/ghn/ghnAPI');
const constant = require('../utils/constants')
const { deleteManyProductsInCart } = require('./cartController')
const randomstring = require('randomstring')
const createOrder = async (req, res) => {
	console.log("createOrder")
	console.log('body: ', req.body)
	req.body.user = 'test_user_id'

	/**create orderId */
	const today = new Date().toJSON().slice(0, 10).replace(/-/g, '');
	const orderId = today + randomstring.generate(5)

	/**order paramaters */
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
	if (products.length == 0) throw new CustomError.NotFoundError('Order is empty or Can not find product')
	console.log('products:', products)

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
	const shippingDetails = createShippingDetails(totalWeight, shippingProvider, shippingServiceId)

	const order = await Order.create({
		orderId: orderId,
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


	//delete products in cart after ordering
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
	console.log("order", order)
	res.status(StatusCodes.CREATED).json(order)
}
const getMyOrders = async (req, res) => {
	console.log("getMyOrders")
	const userId = req.user.userId
	const statusFilter = req.body.statusFilter
	let orders
	if (statusFilter) {
		orders = await Order.find({
			"user.userId": userId,
			"status": statusFilter,
		},
			{ 'orderItems': { $slice: 1 } })
			.select('_id orderId billing status updatedAt')
	} else {
		orders = await Order.find({
			"user.userId": userId,
		},
			{ 'orderItems': { $slice: 1 } }
		).select('_id orderId billing status updatedAt')
	}
	if (!orders) throw new CustomError.NotFoundError('Not found orders')
	res.status(StatusCodes.OK).json(orders)
}

//admin only
const getAllOrders = async (req, res) => {
	const statusFilter = req.body.statusFilter
	const page = req.body.page || 1
	const pageSize = req.body.pageSize || 5
	let orders = null
	const options = {
		page: page,
		limit: pageSize,
		select: '_id orderId user orderItems billing status updatedAt'
	}
	if (statusFilter) {
		orders = await Order.paginate({
			"status": statusFilter,
		}, options)
	} else {
		orders = await Order.paginate({}, options)
	}
	if (!orders) throw new CustomError.NotFoundError('Not found orders')
	console.log('order', orders.page, orders.docs.length)
	res.status(StatusCodes.OK).json(orders)
}

const getOrdersBaseOnTime = async (req, res) => {
	const numberOfDays = req.body.numberOfDays

	if (numberOfDays) {
		await getOrdersBaseOnNumberOfDays(req, res)
	} else {
		await getOrdersBaseOnTimeSpan(req, res)
	}


}

const getOrdersBaseOnNumberOfDays = async (req, res) => {
	console.log('getOrdersBaseOnNumberOfDays')
	const numberOfDays = req.body.numberOfDays
	if (!numberOfDays) throw new CustomError.BadRequestError('Please provide number of days')
	if (numberOfDays > 60) throw new CustomError.BadRequestError('Number of days is too big, try using time span instead')
	const orders = await Order.find(
		{
			createdAt: {
				$gte: Date.now() - numberOfDays * constant.oneDayInMiliceconds/** for now i test in hours. should change back to days:: constant.oneDayInMiliceconds*/
			}
		},
		'orderItems billing status createdAt'
	)
	console.log('orders', orders)
	res.status(StatusCodes.OK).json(orders)
}

const getOrdersBaseOnTimeSpan = async (req, res) => {
	console.log('getOrdersBaseOnTimeSpan')
	const timeSpanStart = req.body.timeSpanStart
	const timeSpanEnd = req.body.timeSpanEnd

	if (!timeSpanStart || !timeSpanEnd) throw new CustomError.BadRequestError('Please provide time span')
	if (numberOfDays > 60) throw new CustomError('Number of days is too big, try using time span instead')

	const startTimeStamp = Date.parse(timeSpanStart)
	const endTimeStamp = Date.parse(timeSpanEnd)

	const orders = await Order.find(
		{
			createdAt: {
				$gte: startTimeStamp,
				$lte: endTimeStamp
			}
		},
		'orderItems billing status createdAt'
	)
	console.log('orders', orders)
	res.status(StatusCodes.OK).json(orders)
}

const getOrderDetails = async (req, res) => {
	console.log("getOrderDetails")
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

//admin only
const updateOrderStatus = async (req, res) => {
	console.log("updateOrderStatus")
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
		case 'RECEIVED':
			await receiveOrder(req, res)
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
		_id: userId
	})
	if (!user) throw CustomError.NotFoundError('User does not exist')

	const order = await Order.findOneAndUpdate({
		_id: orderId,
		"user.userId": userId,
		status: {
			$in: constant.processableStatus
		}
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
		throw new CustomError.NotFoundError('Order does not exist or you can not update order status to PROCESSING')
	}
	console.log('startProcessingOrder:', order)
	//todo: notify user/or can do caching to compare old data vs new data, so that the app can show red noti

	res.status(StatusCodes.OK).json(order)

}
//admin only

//todo: add option, confirming without creating shipping order
const confirmOrder = async (req, res) => {
	/**Confirming means the shop has packed the order and transfer to shipping provider */
	const userId = req.user.userId
	const orderId = req.params.order_id

	console.log('confirming order')

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
	if (!order) throw new CustomError.NotFoundError('Order does not exist')

	//only create new shipping order if there is no one
	if (!order.shippingDetails.expectedDeliveryTime) {
		const shippingOrder = await ghnAPI.orderAPI.createOrder(order)
		console.log('shippingOrder', shippingOrder)
		if (shippingOrder.message) {
			//if failed creating shipping order, revert confirming order.
			order.status = 'PROCESSING'
			await order.save()
			throw new CustomError.InternalServerError(`Giaohangnhanh: ${shippingOrder.message}`)
		}
		//todo: store shipping information
		order.shippingDetails.shippingOrderCode = shippingOrder.order_code
		order.shippingDetails.transType = shippingOrder.trans_type
		order.shippingDetails.mainServiceFee = shippingOrder.fee.main_service
		order.shippingDetails.insurance = shippingOrder.fee.insurance
		order.shippingDetails.totalFee = shippingOrder.total_fee
		order.shippingDetails.expectedDeliveryTime = shippingOrder.expected_delivery_time
		await order.save()
	}
	console.log("confirmed order successfully", order)
	//todo: notify user
	res.status(StatusCodes.OK).json(order)

	/**update sold number and stock nunmber of product */
	for (const item of order.orderItems) {
		const product = await Product.findOneAndUpdate({
			_id: item.productId
		}, {
			$inc: {
				saleNumber: item.quantity,
				stockNumber: -item.quantity
			},
		})
		console.log('product', product)
	};
}

/**only customer can cancel their order, admin should not be able to*/
const cancelOrder = async (req, res) => {
	//only cancel if the order status is pending, processing
	const userId = req.user.userId
	const role = req.user.rold
	const orderId = req.params.order_id

	const user = await User.findOne({
		_id: userId
	})
	if (!user) throw CustomError.NotFoundError('User does not exist')

	const order = await Order.findOne({
		_id: orderId,
		"user.userId": userId,
	}).lean()
	if (!order) throw new CustomError.NotFoundError('Order does not exist')
	let newOrder = null
	if (constant.cancelableStatus.includes(order.status)) {
		//only cancel if the status is pending or processing
		if (role === 'admin') {
			newOrder = await Order.findOneAndUpdate({
				"user.userId": userId,
				_id: orderId
			}, {
				$set: {
					status: 'CANCELED',
					"employee.userId": userId,
					"employee.name": user.name,
					"employee.phoneNumber": user.phoneNumber
				}
			}, { new: true, runValidators: true })
		} else {
			newOrder = await Order.findOneAndUpdate({
				"user.userId": userId,
				_id: orderId
			}, {
				$set: {
					status: 'CANCELED'
				}
			}, { new: true, runValidators: true })
		}

		if (!newOrder) throw new CustomError.NotFoundError('Order does not exist')
	} else {
		throw new CustomError.BadRequestError(`Can not update order status, the order has already been ${order.status}!`)
	}
	//todo: notify user
	res.status(StatusCodes.OK).json(newOrder)
}

/**only customer can receive their order, admin should not be able to*/
const receiveOrder = async (req, res) => {
	//only receive if the order status is confirmed
	const userId = req.user.userId
	const orderId = req.params.order_id

	const user = await User.findOne({
		_id: userId
	})
	if (!user) throw CustomError.NotFoundError('User does not exist')

	const order = await Order.findOne({
		_id: orderId,
		"user.userId": userId,
	}).lean()
	if (!order) throw new CustomError.NotFoundError('Order does not exist')

	let newOrder = null
	if (constant.receivableStatus.includes(order.status)) {
		//only receive if the status is confirmed
		newOrder = await Order.findOneAndUpdate({
			"user.userId": userId,
			_id: orderId
		}, {
			$set: {
				status: 'RECEIVED'
			}
		}, { new: true, runValidators: true })

		if (!newOrder) throw new CustomError.NotFoundError('Order does not exist')
	} else {
		throw new CustomError.BadRequestError(`Can not mark this order as RECEIVED, the order status is ${order.status}! \n You can only receive an order after it has been confirmed!`)
	}
	//todo: notify user
	res.status(StatusCodes.OK).json(newOrder)
}


const searchOrdersByOrderId = async (req, res) => {

	const statusFilter = req.body.statusFilter
	const orderId = req.body.orderId

	if (!orderId) getAllOrders(req, res)

	let orders = null
	if (!statusFilter) {
		orders = await Order.aggregate(
			[{
				$search: {
					index: "orderIdx",
					autocomplete: {
						query: orderId,
						path: 'orderId'
					}
				}
			}
			]
		)
	} else {
		orders = await Order.aggregate(
			[{
				$search: {
					index: "orderIdx",
					autocomplete: {
						query: orderId,
						path: 'orderId'
					}
				}
			},
			{
				$match: { status: statusFilter }
			}
			]
		)
	}

	if (!orders) throw new CustomError.NotFoundError('Not found orders')
	res.status(StatusCodes.OK).json(orders)
}

const searchOrdersByUserName = async (req, res) => {

	const statusFilter = req.body.statusFilter
	const userName = req.body.userName
	if (!userName) getAllOrders(req, res)

	let orders = null
	if (!statusFilter) {
		orders = await Order.aggregate(
			[{
				$search: {
					index: "nameIdx",
					autocomplete: {
						query: userName,
						path: 'user.name'
					}
				}
			}
			]
		)
	} else {
		orders = await Order.aggregate(
			[{
				$search: {
					index: "nameIdx",
					autocomplete: {
						query: userName,
						path: 'user.name'
					}
				}
			},
			{
				$match: { status: statusFilter }
			}
			]
		)
	}



	if (!orders) throw new CustomError.NotFoundError('Not found orders')
	res.status(StatusCodes.OK).json(orders)
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
const createShippingDetails = (totalWeight, shippingProvider, shippingServiceId) => {
	return { weight: totalWeight, shippingServiceId }
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
	cancelOrder,
	searchOrdersByOrderId,
	searchOrdersByUserName,
	getOrdersBaseOnTime,
}