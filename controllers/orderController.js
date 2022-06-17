const Order = require('../models/Order')
const Product = require('../models/Product')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const { Address } = require('../models/Address');
const ghnAPI = require('../services/ghn/ghnAPI');
const constant = require('../utils/constants')
const createOrder = async (req, res) => {
	console.log('body: ', req.body)
	req.body.user = 'test_user_id'

	const userId = req.user.userId
	const cartItems = req.body.cartItems
	const paymentMethod = req.body.paymentMethod
	const addressId = req.body.addressId
	const note = req.body.note
	const shippingProvider = req.body.shippingProvider

	//get list ordered products
	let oidArr = []
	cartItems.forEach(cartItem => {
		oidArr.push(cartItem.productId)
	});
	console.log('oidArr:', oidArr)
	const products = await Product.find({
		_id: {
			$in: oidArr
		}
	}).select('_id sku name category price imageUrl quantity weight')
	console.log('products:', products)
	if (!products) throw new CustomError.InternalServerError('Error')

	//get address
	const address = await Address.findOne({
		userId,
		"address._id": addressId
	})
	console.log('address:', address)
	if (!products) throw new CustomError.NotFoundError('Can not find address')

	//get shipping fee
	const shippingFee = calculateShippingFee(address, shippingProvider)
	//get Billing Info
	const billing = calculateBilling(products, shippingFee, paymentMethod)
	//get shipping details
	const shippingDetails = getShippingDetails(shippingProvider)
	//create an order doc
	const userOrder = new userOrder({ userId, name: req.user.name })
	const order = await Order.create({
		user: userOrder,
		address,
		orderItems: products,
		billing,
		note,
		shippingDetails
	})

	if (paymentMethod === 'COD') {
		res.status(StatusCodes.CREATED).json({
			paymentMethod,
			order
		})
	} else {
		createPaymentOrder(paymentMethod, products)
		//handle: resturn and exception
	}
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
	const feeOptions = await ghnAPI.serviceAndCalculateFeeAPI.calculateFee(
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
// estimate time
// calculateBilling 
// getShippingDetails

module.exports = {
	getShippingFeeOptions
}