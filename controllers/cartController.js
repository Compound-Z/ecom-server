const e = require('express');
const { StatusCodes } = require('http-status-codes');
const { connect } = require('http2');
const CustomError = require('../errors');
const Cart = require('../models/Cart');
const { ItemSchema } = require('../models/Item');
const { deleteMany } = require('../models/Product');
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
	})
		.populate({
			path: 'shopId',
			select: { 'name': 1, 'imageUrl': 1, 'addressItem': 1 }
		})
		.select('_id name price imageUrl quantity weight sku shopId').lean()

	console.log('products:', products)
	if (!products) throw new CustomError.InternalServerError('Error')

	//assign quantity and productId to each product
	products.forEach((element, idx) => {
		cart.cartItems.every(item => {
			if (element._id.equals(item.productId)) {
				element["quantity"] = item.quantity
				element["productId"] = item.productId
				return false
			}
			return true
		})
	});

	res.status(StatusCodes.OK).json(products)
}
const addAProductToCart = async (req, res) => {
	const userId = req.user.userId
	const productId = req.body.productId
	const quantity = req.body.quantity

	const product = await Product.findOne({ _id: productId })
	if (!product) {
		throw new CustomError.NotFoundError(`Product ${productId} doesn't exist`)
	}
	const existedItem = await Cart.findOne(
		{
			userId: userId,
			"cartItems.productId": productId
		}, {
		'cartItems.$': 1
	}
	)
	console.log('existed', existedItem)
	if (!existedItem) {
		//if item doesn't exist, push new item to the cart
		const cart = await Cart.findOneAndUpdate(
			{ userId: userId },
			{
				$push: {
					cartItems: {
						productId,
						quantity,
						shop: product.shopId,
					}
				}
			},
			{ new: true, runValidators: true, context: 'query' }
		)
		if (!cart) throw new CustomError.NotFoundError('This user does not exist')
		console.log('cart', cart)
		res.status(StatusCodes.CREATED).json({ message: "Add product to cart successfully" })
	} else {
		//if item existed, update item's quantity in the cart
		req.params.productId = productId
		req.body.quantity = existedItem.cartItems[0].quantity + 1
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
			res.status(StatusCodes.OK).json({ message: "Adjust product quantity successfully!" })
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
	console.log('deletedItem:', deletedItem)

	if (!deletedItem) {
		throw new CustomError.NotFoundError(`Product or cart doesn\'t exist`)
	}
	res.status(StatusCodes.OK).json({ message: "Remove item from cart successfully" })

}
const deleteManyProductsInCart = async (userId, cartItems) => {
	const cartItemIds = []
	cartItems.forEach(item => {
		cartItemIds.push(item.productId)
	});

	const cart = await Cart.findOne(
		{
			userId: userId,
		}
	)
	console.log('cartItemIds', cartItemIds)

	cart.cartItems = cart.cartItems.filter(function (item) {
		console.log('item', item)
		console.log('include', cartItemIds.includes(item.productId.toString()))
		return !cartItemIds.includes(item.productId.toString())
	})
	console.log('cart', cart)
	const deletedCart = await cart.save()
	console.log('deleted cart', deletedCart)
	if (!deletedCart) {
		throw new CustomError.NotFoundError(`Product or cart doesn\'t exist`)
	}
	return true
}
module.exports = {
	getAllProductsInCart,
	addAProductToCart,
	adjustProductQuantityInCart,
	deleteProductInCart,
	deleteManyProductsInCart,
}