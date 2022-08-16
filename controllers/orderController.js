const Order = require('../models/Order')
const Product = require('../models/Product')
const Shop = require('../models/Shop')
const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const { Address } = require('../models/Address');
const ghnAPI = require('../services/ghn/ghnAPI');
const constant = require('../utils/constants')
const { deleteManyProductsInCart } = require('./cartController')
const randomstring = require('randomstring')
const { sendPushNotiToCustomer, sendPushNotiToAdmins, sendPushNotiToAdmin } = require('../services/firebase/pushNotification')
const { addListProductsToReviewQueue } = require('../controllers/reviewController')
const token = process.env.GHN_API_KEY_TEST
const _ = require('underscore');
const mongoose = require('mongoose');
const axios = require('axios').default;

const createOrder = async (req, res) => {
	console.log("createOrder")
	console.log('body: ', req.body)
	req.body.user = 'test_user_id'



	/**order paramaters */
	const userId = req.user.userId
	const orderItems = req.body.orderItems
	const paymentMethod = req.body.paymentMethod
	const addressItemId = req.body.addressItemId
	const note = req.body.note
	const shippingProvider = req.body.shippingProvider

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

	//todo: populate shop
	const products = await Product.find({
		_id: {
			$in: oidArr
		}
	})
		.populate({
			path: 'shopId',
			select: { 'shippingShopId': 1, 'addressItem': 1, 'name': 1 }
		})
		.select('_id sku name category price imageUrl quantity weight orderId').lean()
	if (!products) throw new CustomError.InternalServerError('Error')
	if (products.length == 0) throw new CustomError.NotFoundError('Order is empty or Can not find product')

	//assign quantity and productId from orderItems to each product
	const sortedOrderItems = _(orderItems).sortBy(item => item.productId)
	const sortedProducts = _(products).sortBy(product => product._id)
	sortedProducts.forEach((element, idx) => {
		element.quantity = sortedOrderItems[idx].quantity
		element.productId = element._id
		element.shippingServiceId = sortedOrderItems[idx].shippingServiceId
		element['shopName'] = element.shopId.name
	});
	console.log('sorted products', products)
	//todo: group products by shop so that each group will be a sub-order
	const productsGrouped = _(products).groupBy(product => product.shopId._id)

	console.log('grouped products', productsGrouped)
	// get user's address
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

	//calculate total weight and product cost of each sub-order
	let ordersObj = {}
	for (let [groupName, products] of Object.entries(productsGrouped)) {
		const result = calWeightCost(products)
		ordersObj[groupName] = {
			totalWeight: result.totalWeight,
			totalProductCost: result.totalProductCost
		}
	}
	console.log('ordersObj', ordersObj)

	//cal shipping fee for each sub order
	for (const [groupName, products] of Object.entries(productsGrouped)) {
		// //get shipping fee //todo: eastimate base on shop
		const estimatedShippingFee = await ghnAPI.serviceAndCalculateFeeAPI.calculateFee(
			products[0].shopId.shippingShopId,
			products[0].shippingServiceId,
			products[0].shopId.addressItem.district.districtId,
			address.addresses[0].district.districtId,
			address.addresses[0].ward.code,
			ordersObj[groupName].totalWeight,
			constant.shipping.PACKAGE_LENGTH_DEFAULT,
			constant.shipping.PACKAGE_WIDTH_DEFAULT,
			constant.shipping.PACKAGE_HEIGHT_DEFAULT,
			ordersObj[groupName].totalProductCost
		)
		ordersObj[groupName]["shippingFee"] = estimatedShippingFee
		console.log('shipping fee:', estimatedShippingFee)
	}
	console.log('ordersObj 2', ordersObj)

	const userOrder = createUserOrder(userId, user.name, user.phoneNumber)
	//todo: for each shop, create billing, shipping details
	let listCreatedOrder = []
	for (const [groupName, products] of Object.entries(productsGrouped)) {
		const subOrder = ordersObj[groupName]
		const orderId = generateOrderId()
		const billing = createBilling(subOrder.totalProductCost, subOrder.shippingFee, paymentMethod)
		const shippingDetails = createShippingDetails(subOrder.totalWeight, shippingProvider, products[0].shippingServiceId)
		//foreach shop, create an order
		const order = await Order.create({
			orderId: orderId,
			user: userOrder,
			address: address.addresses[0],
			orderItems: products,
			billing,
			note,
			shippingDetails,
			shopRef: products[0].shopId._id
		})
		if (!order) {
			throw new CustomError.InternalServerError('System Error: Can not create new order')
		}
		console.log("order", order)
		listCreatedOrder.push(order)
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
	/**to compatible with object model in front-end */
	/**deep copy to new obj so that i can assign new shopRef to the order */
	const newOrderWithShopRefObj = JSON.parse(JSON.stringify(listCreatedOrder[0]))
	newOrderWithShopRefObj.shopRef = {}
	console.log('newOrderWithShopRefObj', newOrderWithShopRefObj)
	res.status(StatusCodes.CREATED).json(newOrderWithShopRefObj)


	//todo: send pust notis to many sellers | only return the first order since the client wont use this data anw
	sendPushNotiToAdmins(user, listCreatedOrder)
}
const calWeightCost = (products) => {
	let totalWeight = 0
	let totalProductCost = 0
	products.forEach(product => {
		totalWeight += product.weight * product.quantity
		totalProductCost += product.price * product.quantity
	});
	return { totalWeight, totalProductCost }

}

const generateOrderId = () => {
	/**create orderId */
	const today = new Date().toJSON().slice(0, 10).replace(/-/g, '');
	const orderId = today + randomstring.generate(5)
	return orderId
}

const getMyOrders = async (req, res) => {
	console.log("getMyOrders")
	const userId = req.user.userId
	const role = req.user.role
	const statusFilter = req.body.statusFilter
	const shopId = req.user.shopId

	//setup query obj based on the req
	let queryObj = {}
	if (role === 'customer') {
		queryObj['user.userId'] = userId
	} else if (role === 'seller') {
		queryObj['shopRef'] = shopId
	}

	if (statusFilter) {
		queryObj['status'] = statusFilter
	}

	let orders = null

	if (role === 'customer') {
		orders = await Order.find(
			queryObj,
			{ 'orderItems': { $slice: 1 } }
		).select('_id orderId billing status updatedAt shippingDetails.expectedDeliveryTime shippingDetails.status')

	} else if (role === 'seller') {
		const page = req.body.page || 1
		const pageSize = req.body.pageSize || 10
		const options = {
			sort: {
				updatedAt: -1
			},
			page: page,
			limit: pageSize,
			select: '_id orderId user orderItems billing status updatedAt shippingDetails.expectedDeliveryTime shippingDetails.status',
			select: {
				orderItems: { $slice: 1 }
			}
		}
		orders = await Order.paginate(
			queryObj,
			options
		)
	}
	console.log("orders", orders)
	if (!orders) throw new CustomError.NotFoundError('Not found orders')
	res.status(StatusCodes.OK).json(orders)
}


//admin only
const getAllOrders = async (req, res) => {
	const statusFilter = req.body.statusFilter
	const page = req.body.page || 1
	const pageSize = req.body.pageSize || 10


	// const testPage = await Order.paginate({}, { page: 1, litmit: pageSize })
	// const totalPages = testPage.totalPages
	// const revertedPage = totalPages - page + 1
	// console.log('revertedPage', revertedPage, testPage)
	let orders = null
	const options = {
		sort: {
			updatedAt: -1
		},
		page: page,
		limit: pageSize,
		select: '_id orderId user orderItems billing status updatedAt',
	}
	if (statusFilter) {
		orders = await Order.paginate({
			"status": statusFilter,
		}, options)
	} else {
		orders = await Order.paginate({}, options)
	}
	if (!orders) throw new CustomError.NotFoundError('Not found orders')
	// console.log('order', orders)
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
	const shopId = req.user.shopId
	console.log('getOrdersBaseOnNumberOfDays')
	const numberOfDays = req.body.numberOfDays
	if (!numberOfDays) throw new CustomError.BadRequestError('Please provide number of days')
	if (numberOfDays > 60) throw new CustomError.BadRequestError('Number of days is too big, try using time span instead')
	const orders = await Order.find(
		{
			shopRef: shopId,
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
	const shopId = req.user.shopId
	const orderId = req.params.order_id
	const role = req.user.role
	let queryObj = { _id: orderId }
	if (role === 'customer') {
		queryObj['user.userId'] = userId
	} else if (role === 'seller') {
		queryObj['shopRef'] = mongoose.Types.ObjectId(shopId)
	}
	console.log(userId, shopId, orderId, queryObj)

	const order = await Order.findOne(queryObj).populate({ path: 'shopRef', select: 'addressItem' })
	console.log('order:', order)
	if (!order) throw new CustomError.NotFoundError('Order does not exist')
	res.status(StatusCodes.OK).json(order)
}

//seller only
const updateOrderStatus = async (req, res) => {
	console.log("updateOrderStatus")
	const status = req.body.status
	const role = req.user.role
	switch (status) {
		case 'CONFIRMED':
			if (!(role === 'seller')) throw new CustomError.UnauthorizedError('Unauthorized to access this route')
			await confirmOrder(req, res)
			break;
		case 'PROCESSING':
			if (!(role === 'seller')) throw new CustomError.UnauthorizedError('Unauthorized to access this route')
			await startProcessingOrder(req, res)
			break;
		case 'CANCELED':
			if (!(role === 'customer')) throw new CustomError.UnauthorizedError('Unauthorized to access this route')
			await cancelOrder(req, res)
			break;
		case 'RECEIVED':
			if (!(role === 'customer')) throw new CustomError.UnauthorizedError('Unauthorized to access this route')
			await receiveOrder(req, res)
			break;
		default:
			throw new CustomError.BadRequestError('Status undefined!')
	}
}

//only seller
const startProcessingOrder = async (req, res) => {
	const orderId = req.params.order_id
	const userId = req.user.userId
	const shopId = req.user.shopId
	console.log('shopId', shopId)

	//this is seller info
	const seller = await User.findOne({
		_id: userId
	})
	if (!seller) throw CustomError.NotFoundError('User does not exist')

	const order = await Order.findOneAndUpdate({
		_id: orderId,
		shopRef: shopId,
		status: {
			$in: constant.processableStatus
		}
	}, {
		$set: {
			status: 'PROCESSING',
			"employee.userId": userId,
			"employee.name": seller.name,
			"employee.phoneNumber": seller.phoneNumber
		}
	}, { new: true, runValidators: true })
	if (!order) {
		console.log('order', order)
		throw new CustomError.NotFoundError('Order does not exist or you can not update order status to PROCESSING')
	}

	console.log('startProcessingOrder:', order)

	/**to compatible with object model in front-end */
	/**deep copy to new obj so that i can assign new shopRef to the order */
	const newOrderWithShopRefObj = JSON.parse(JSON.stringify(order))
	newOrderWithShopRefObj.shopRef = {}
	res.status(StatusCodes.OK).json(newOrderWithShopRefObj)
	//todo: notify user/or can do caching to compare old data vs new data, so that the app can show red noti
	sendPushNotiToCustomer(order)
}
//admin only

//todo: add option, confirming without creating shipping order
const confirmOrder = async (req, res) => {
	/**Confirming means the shop has packed the order and transfer to shipping provider */
	const userId = req.user.userId
	const shopId = req.user.shopId
	const orderId = req.params.order_id

	console.log('confirming order')

	const seller = await User.findOne({
		_id: userId
	})
	if (!seller) throw CustomError.NotFoundError('User does not exist')

	const order = await Order.findOneAndUpdate({
		_id: orderId,
		shopRef: shopId,
		status: {
			$in: constant.confirmableStatus
		}
	}, {
		$set: {
			status: 'CONFIRMED',
			"employee.userId": userId,
			"employee.name": seller.name,
			"employee.phoneNumber": seller.phoneNumber
		}
	}, { new: true, runValidators: true }).populate('shopRef')
	if (!order) throw new CustomError.NotFoundError('Order does not exist or you can not CONFIRM this order')
	console.log('order', order)
	//only create new shipping order if there is no one
	if (!order.shippingDetails.expectedDeliveryTime) {
		console.log('shipping shop', order.shopRef.shippingShopId)
		try {
			const shippingOrder = await ghnAPI.orderAPI.createOrder(parseInt(order.shopRef.shippingShopId), order)
			console.log('shippingOrder', shippingOrder)

			//todo: store shipping information
			order.shippingDetails.shippingOrderCode = shippingOrder.order_code
			order.shippingDetails.transType = shippingOrder.trans_type
			order.shippingDetails.mainServiceFee = shippingOrder.fee.main_service
			order.shippingDetails.insurance = shippingOrder.fee.insurance
			order.shippingDetails.totalFee = shippingOrder.total_fee
			order.shippingDetails.expectedDeliveryTime = shippingOrder.expected_delivery_time
			order.shippingDetails.log = [] //at first, log will be empty
			await order.save()
		} catch (error) {
			console.log('error', error)
			order.status = 'PROCESSING'
			await order.save()
			throw new CustomError.InternalServerError(`Giaohangnhanh: ${error.originErrorObj.code_message_value}`)
		}

	}
	console.log("confirmed order successfully", order)
	/**deep copy to new obj so that i can assign new shopRef to the order */
	const newOrderWithShopRefObj = JSON.parse(JSON.stringify(order))
	newOrderWithShopRefObj.shopRef = {}
	res.status(StatusCodes.OK).json(newOrderWithShopRefObj)

	//send push noti to custumer
	sendPushNotiToCustomer(order)
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

/**only customer can cancel their order, admin and seller should not be able to*/
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
	})
	if (!order) throw new CustomError.NotFoundError('Order does not exist')
	let newOrder = null
	if (constant.cancelableStatus.includes(order.status)) {
		//only cancel if the status is pending or processing
		if (role === 'admin') { //this code segment should be removed, but since i have block admin and seller from using this feature, leaving this intact is acceptable.
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
	console.log('newOrder', newOrder)

	/**deep copy to new obj so that i can assign new shopRef to the order */
	const newOrderWithShopRefObj = JSON.parse(JSON.stringify(newOrder))
	newOrderWithShopRefObj.shopRef = {}
	res.status(StatusCodes.OK).json(newOrderWithShopRefObj)

	//todo: notify user
	sendPushNotiToAdmin(user, newOrder)
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
	})
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

	/**deep copy to new obj so that i can assign new shopRef to the order */
	const newOrderWithShopRefObj = JSON.parse(JSON.stringify(newOrder))
	newOrderWithShopRefObj.shopRef = {}
	res.status(StatusCodes.OK).json(newOrderWithShopRefObj)

	//add received products to reviewQueue
	await addListProductsToReviewQueue(userId, newOrder)
}

//feature for seller only
const searchOrdersByOrderId = async (req, res) => {

	const statusFilter = req.body.statusFilter
	const orderId = req.body.orderId
	const shopId = req.user.shopId
	const page = req.body.page || 1
	const pageSize = req.body.pageSize || 10

	if (!orderId) {
		await getMyOrders(req, res)
		return
	}

	const options = {
		sort: {
			updatedAt: -1
		},
		page: page,
		limit: pageSize,
		select: '_id orderId user orderItems billing status updatedAt shopRef',
	}

	let orders = null
	if (!statusFilter) {
		const aggregate = Order.aggregate()
		aggregate.search({
			index: "orderIdx",
			autocomplete: {
				query: orderId,
				path: 'orderId'
			}
		}).match({ shopRef: mongoose.Types.ObjectId(shopId) })
		orders = await Order.aggregatePaginate(aggregate, options)
	} else {
		const aggregate = Order.aggregate()
		aggregate.search({
			index: "orderIdx",
			autocomplete: {
				query: orderId,
				path: 'orderId'
			}
		}).match({ shopRef: mongoose.Types.ObjectId(shopId), status: statusFilter })
		orders = await Order.aggregatePaginate(aggregate, options)
	}
	console.log('order', orders)
	if (!orders) throw new CustomError.NotFoundError('Not found orders')

	res.status(StatusCodes.OK).json(orders)
}

const searchOrdersByUserName = async (req, res) => {

	const statusFilter = req.body.statusFilter
	const userName = req.body.userName
	const shopId = req.user.shopId
	const page = req.body.page || 1
	const pageSize = req.body.pageSize || 10

	console.log('shopid', shopId)
	if (!userName) {
		await getMyOrders(req, res)
		return
	}

	const options = {
		sort: {
			updatedAt: -1
		},
		page: page,
		limit: pageSize,
		select: '_id orderId user orderItems billing status updatedAt',
	}
	let orders = null
	if (!statusFilter) {
		const aggregate = Order.aggregate()
		aggregate.
			search({
				index: "nameIdx",
				autocomplete: {
					query: userName,
					path: 'user.name'
				}
			}).match({ shopRef: mongoose.Types.ObjectId(shopId) })
		orders = await Order.aggregatePaginate(aggregate, options)
	} else {
		const aggregate = Order.aggregate()
		aggregate.
			search({
				index: "nameIdx",
				autocomplete: {
					query: userName,
					path: 'user.name'
				}
			}).match({ shopRef: mongoose.Types.ObjectId(shopId), status: statusFilter })
		orders = await Order.aggregatePaginate(aggregate, options)
	}

	if (!orders) throw new CustomError.NotFoundError('Not found orders')
	console.log('order', orders)
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

	//get shop info
	const shopId = products[0].shopId
	const shop = await Shop.findOne({ _id: shopId })
	console.log('shopId', shop.shippingShopId)

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
		parseInt(shop.shippingShopId),
		parseInt(shop.addressItem.district.districtId),
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
const getOrderInfo = async () => {
	//find the orders that need to be tracked
	//the conditions is: order status is CONFIRMED, the shipping order status is not [cancel, delivered, returned]
	console.log("NEW INTERVAL ************************************************************")
	try {
		const orders = await Order.find(
			{
				status: 'CONFIRMED',
				"shippingDetails.status": {
					$nin: ['cancel', 'delivered', 'returned']
				}
			})

		if (orders && orders.length > 0) {
			for (const order of orders) {
				const orderCode = order.shippingDetails.shippingOrderCode
				console.log("**************", orderCode)
				if (orderCode) {
					try {
						//get info of each order
						const response = await axios.post(
							'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/detail',
							{
								"order_code": orderCode
							}, {
							headers: {
								'Content-Type': 'application/json',
								'Token': token,
							}
						}
						)

						if (response.status === 200) {
							console.log('axios-ghn', response.data)
							//if the shipping status is different from the current shipping status, update it.
							if (response.data.data.status !== order.shippingDetails.status) {
								//update new status
								console.log('update new status', response.data.data.status, order.shippingDetails.status)
								order.shippingDetails.status = response.data.data.status
								//if log exists in response
								if (response.data.data.log) {
									console.log('log exist', response.data.data.log)
									order.shippingDetails.log = response.data.data.log
								}
								const newOrder = await order.save()
								console.log('save done', newOrder)
								// const updatedOrder = await Order.findOneAndUpdate(
								// 	{
								// 		_id: order._id
								// 	},{
								// 		$set:{
								// 			"shippingDetails.status": response.data.data.status
								// 		}
								// 	}
								// )
							}
						}
					} catch (error) {
						console.log('axios-ghn error', error)
					}
				}
			}
		}
	} catch (error) {
		console.log('error when getting order info', error.message)
	}

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
	receiveOrder,
	searchOrdersByOrderId,
	searchOrdersByUserName,
	getOrdersBaseOnTime,
	getOrderInfo,
}