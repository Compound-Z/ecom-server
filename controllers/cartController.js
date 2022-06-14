const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const Cart = require('../models/Cart');


const getAllProductsInCart = async (req, res) => {
	const userId = req.user.userId
	const cart = await Cart.findOne(
		{
			userId: userId
		}).select('cartItems')
	console.log('products:', cart)
	res.status(StatusCodes.OK).json(cart.cartItems)
}
const addAProductToCart = async (req, res) => {
	const userId = req.user.userId
	const productDetailId = req.body.productDetailId
	const existedItem = await Cart.findOne(
		{
			userId: userId,
			"cartItems.productDetailId": productDetailId
		}
	)
	console.log('existingitem:', existedItem)
	if (!existedItem) {
		//if item doesn't exist, push new item to the cart
		const cart = await Cart.findOneAndUpdate(
			{ userId: userId },
			{
				$push: {
					cartItems: req.body
				}
			},
			{ new: true, runValidators: true }
		)
		res.status(StatusCodes.CREATED).json(cart)
	} else {
		//if item existed, update item's quantity in the cart
		req.params.productDetailId = productDetailId
		adjustProductQuantityInCart(req, res)
	}

}
const adjustProductQuantityInCart = async (req, res) => {
	console.log('params:', req.params)
	const userId = req.user.userId
	const newQuantity = req.body.quantity
	const productDetailId = req.params.productDetailId
	if (newQuantity === 0) {
		/**if the new quantity is ===0, delete the item from cacrt */
		deleteProductInCart(req, res)
	} else {
		/**if the new quantity is not ===0, update */
		const newCart = await Cart.findOneAndUpdate(
			{
				userId: userId,
				"cartItems.productDetailId": productDetailId
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
		}
		res.status(StatusCodes.OK).json(newCart)
	}
}
const deleteProductInCart = async (req, res) => {
	console.log('params:', req.params)
	const userId = req.user.userId
	const productDetailId = req.params.productDetailId
	const deletedItem = await Cart.findOneAndUpdate(
		{
			userId: userId,
			"cartItems.productDetailId": productDetailId
		},
		{
			$pull: {
				cartItems: { productDetailId: productDetailId },
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