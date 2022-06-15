const Order = require('../models/Order')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const Address = require('../models/Address');

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
//todo:
calculateShippingFee
calculateBilling //calculate total weight also
getShippingDetails