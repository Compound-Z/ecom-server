const Product = require('../models/Product')
const ProductDetail = require('../models/ProductDetail')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const uploadFile = require('../utils/fileUploadHelper')


const getAllProducts = async (req, res) => {
	const products = await Product.find({}).select('-user -createdAt -updatedAt -__v -id')
	res.status(StatusCodes.OK).json(products)
}

const getProductDetails = async (req, res) => {
	const productId = req.params.id

	const product = await ProductDetail.findOne({ _id: productId })/*.populate('reviews')*/
	if (!product) {
		throw new CustomError.NotFoundError(`This product with id ${productId} does not exist`)
	}
	res.status(StatusCodes.OK).json(product)
}

const createProduct = async (req, res) => {
	//for now, user will be hardcoded: 
	console.log('body: ', req.body)
	req.body.user = 'test_user_id'
	const { product: productReq, productDetail: productDetailReq } = req.body
	// const productReq = req.body.product
	// const productDetailReq = req.body.productDetail

	console.log("Req:", productDetailReq)
	if (!productReq || !productDetailReq) {
		throw new CustomError.BadRequestError('productReq or productDetailReq is missing')
	}
	//first, create an ProductDetail object
	const productDetail = await ProductDetail.create(productDetailReq)

	//it will be replace to: take user's info from jwt: req.body.user = req.user.id
	productReq.productDetailId = productDetail._id
	const product = await Product.create(productReq)

	res.status(StatusCodes.CREATED).json(product)
}

//todo: change to multi file upload?
const uploadImage = async (req, res) => {
	uploadFile(req, res, '10-ecom/product')
}
const updateProduct = async (req, res) => {
	const productId = req.params.id
	const { product: productReq, productDetail: productDetailReq } = req.body
	const product = await Product.findOneAndUpdate(
		{ _id: productId },
		productReq,
		{ new: true, runValidators: true })

	if (!product) {
		throw new CustomError.NotFoundError(`This product with id ${productId} does not exist`)
	}

	const productDetail = await ProductDetail.findOneAndUpdate(
		{ _id: product.productDetailId },
		productDetailReq,
		{ new: true, runValidators: true })

	if (!productDetail) {
		throw new CustomError.NotFoundError(`This productDetail with id ${product.productDetailId} does not exist`)
	}
	res.status(StatusCodes.OK).json(product)
}
const deleteProduct = async (req, res) => {
	const productId = req.params.id

	const product = await Product.findOne({ _id: productId })
	if (!product) {
		throw new CustomError.NotFoundError(`This product with id ${productId} does not exist`)
	}

	//delete product detail first
	const productDetail = await ProductDetail.findOne({ _id: product.productDetailId })
	if (!productDetail) {
		throw new CustomError.NotFoundError(`This productDetail with id ${product.productDetailId} does not exist`)
	}
	await productDetail.remove()

	//then delete product
	await product.remove()
	res.status(StatusCodes.OK).json({ msg: "remove product successfully" })
}

module.exports = {
	getAllProducts,
	getProductDetails,
	createProduct,
	uploadImage,
	updateProduct,
	deleteProduct
}