const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const Cart = require('../models/Cart');
const { ItemSchema } = require('../models/Item');
const Product = require('../models/Product');


const getAllProductsInCart = async (req, res) => {
	const userId = req.user.userId

	//get list product id in cart
	const cart = await Cart.findOne(
		{
			userId: userId
		}).select('cartItems')
	console.log('cart:', cart)
	if (!cart) throw new CustomError.NotFoundError('This user doesn\'t exist')

	//get product info for each id
	//create array of oid for querying
	let oidArr = []
	cart.cartItems.forEach(cartItem => {
		oidArr.push(cartItem.productId)
	});
	console.log('oidArr:', oidArr)
	const products = await Product.find({
		_id: {
			$in: oidArr
		}
	}).select('_id name price imageUrl quantity weight').lean()

	console.log('products:', products)
	if (!products) throw new CustomError.InternalServerError('Error')

	//assign quantity
	products.forEach((element, idx) => {
		element["quantity"] = cart.cartItems[idx].quantity
		element["productId"] = cart.cartItems[idx].productId
	});
	res.status(StatusCodes.OK).json(products)
}
const addAProductToCart = async (req, res) => {
	const userId = req.user.userId
	const productId = req.body.productId
	const quantity = req.body.quantity

	const product = await Product.findOne({ _id: productId })
	console.log('product', product)
	if (!product) {
		throw new CustomError.NotFoundError(`Product ${productDetailId} doesn't exist`)
	}

	const existedItem = await Cart.findOne(
		{
			userId: userId,
			"cartItems.productId": productId
		}
	)
	console.log('existingitem:', existedItem)
	if (!existedItem) {
		//if item doesn't exist, push new item to the cart
		const cart = await Cart.findOneAndUpdate(
			{ userId: userId },
			{
				$push: {
					cartItems: {
						productId,
						quantity
					}
				}
			},
			{ new: true, runValidators: true, context: 'query' }
		)
		if (!cart) throw new CustomError.NotFoundError('This user does not exist')
		res.status(StatusCodes.CREATED).json(cart)
	} else {
		//if item existed, update item's quantity in the cart
		req.params.productId = productId
		adjustProductQuantityInCart(req, res)
	}

}
const adjustProductQuantityInCart = async (req, res) => {
	console.log('params:', req.params)
	const userId = req.user.userId
	const newQuantity = req.body.quantity
	const productId = req.params.productId
	if (newQuantity === 0) {
		/**if the new quantity is ===0, delete the item from cacrt */
		deleteProductInCart(req, res)
	} else {
		/**if the new quantity is not ===0, update */
		const newCart = await Cart.findOneAndUpdate(
			{
				userId: userId,
				"cartItems.productId": productId
			},
			{
				$set: {
					"cartItems.$.quantity": newQuantity
				}
			},
			{ new: true, runValidators: true }
		)
		if (!newCart) {
			throw new CustomError.NotFoundError(`Item ${userId} doesn\'t exist`)
		} else {
			res.status(StatusCodes.OK).json(newCart)
		}
	}
}
const deleteProductInCart = async (req, res) => {
	console.log('params:', req.params)
	const userId = req.user.userId
	const productId = req.params.productId
	const deletedItem = await Cart.findOneAndUpdate(
		{
			userId: userId,
			"cartItems.productId": productId
		},
		{
			$pull: {
				cartItems: { productId: productId },
			}
		}
	)
	if (!deletedItem) {
		throw new CustomError.NotFoundError(`Product or cart doesn\'t exist`)
	}
	res.status(StatusCodes.OK).json({ msg: "Remove item from cart successfully" })

}
module.exports = {
	getAllProductsInCart,
	addAProductToCart,
	adjustProductQuantityInCart,
	deleteProductInCart,
}