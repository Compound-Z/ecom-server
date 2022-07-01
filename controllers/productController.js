const Product = require('../models/Product')
const ProductDetail = require('../models/ProductDetail')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const uploadFile = require('../utils/fileUploadHelper');
const Category = require('../models/Category');
const { addUnderline } = require('../utils/stringHelper')
const CountrySchema = require('../models/Country');
const { default: mongoose } = require('mongoose');

const getAllProducts = async (req, res) => {
	const products = await Product.find({}).select('-user -createdAt -updatedAt -__v -id')
	if (!products) throw new CustomError.NotFoundError('Not found')
	res.status(StatusCodes.OK).json(products)
}

const getProductDetails = async (req, res) => {
	const productId = req.params.id

	const productDetail = await ProductDetail.findOne({ productId: productId })/*.populate('reviews')*/
	if (!productDetail) {
		throw new CustomError.NotFoundError(`This productDetail with productId ${productId} does not exist`)
	}
	res.status(StatusCodes.OK).json(productDetail)
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
	productReq.category = addUnderline(productReq.category)
	/**check category */
	const category = await Category.findOne({ name: productReq.category })
	if (!category) throw new CustomError.BadRequestError('Category does not exist')
	console.log('category', category)
	/**First, create a product doc */
	const product = await Product.create(productReq)
	if (!product) {
		throw new CustomError.ThirdPartyServiceError('Can not create Product')
	}
	/**then, create an ProductDetail doc and assign productId to the productDetail doc*/
	productDetailReq.productId = product._id
	const productDetail = await ProductDetail.create(productDetailReq)
	if (!productDetail) {
		throw new CustomError.ThirdPartyServiceError('Can not create ProductDetail')
	}

	/**increate category's product number */
	category.numberOfProduct = category.numberOfProduct + 1
	await category.save()

	res.status(StatusCodes.CREATED).json(product)
}

//todo: change to multi file upload?
const uploadImage = async (req, res) => {
	uploadFile(req, res, 'ecom/product')
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
		{ productId: productId },
		productDetailReq,
		{ new: true, runValidators: true })

	if (!productDetail) {
		throw new CustomError.NotFoundError(`This productDetail with id ${product.productDetailId} does not exist`)
	}
	res.status(StatusCodes.OK).json(product)
}
const deleteProduct = async (req, res) => {
	const productId = req.params.id

	const product = await Product.findOneAndDelete({ _id: productId })
	if (!product) {
		throw new CustomError.NotFoundError(`This product with id ${productId} does not exist`)
	}

	const productDetail = await ProductDetail.findOneAndDelete({ productId: productId })
	if (!productDetail) {
		throw new CustomError.NotFoundError(`This productDetail does not exist`)
	}

	const category = await Category.findOneAndUpdate(
		{
			name: product.category,
			numberOfProduct: { $gte: 1 }
		}, {
		$inc: {
			numberOfProduct: -1
		}
	}
	)
	if (!category) {
		throw new CustomError.InternalServerError(`System error, update category failed!`)
	}

	res.status(StatusCodes.OK).json({ message: "remove product successfully" })
}

const searchProducts = async (req, res) => {
	/**currently, search by compounded text index: category-name */
	/**Todo: Should be search by tags, or description? */
	const searchWords = req.params.search_words

	/**autocomplete search by name, category using Atlas search index instead of text index*/
	const products = await Product.aggregate([
		{
			$search: {
				compound: {
					should: [
						{

							autocomplete: {
								query: searchWords,
								path: 'name'
							},
						},
						{
							autocomplete: {
								query: searchWords,
								path: 'category'
							},
						}
					],
				}
			}
		}
		/**Todo: this may be used with project: name, limit: 5, to create search suggestions */
		// {
		// 	$project: {
		// 		score: { $meta: "searchScore" },
		// 	}
		// }
	])

	if (!products) throw new CustomError.NotFoundError('Not found')
	res.status(StatusCodes.OK).json(products)
}
const getOrigins = async (req, res) => {
	const Country = mongoose.model('Country', CountrySchema)
	const countries = await Country.find()
	if (!countries) throw CustomError.NotFoundError('Not found countries')
	res.status(StatusCodes.OK).json(countries)
}
module.exports = {
	getAllProducts,
	getProductDetails,
	createProduct,
	uploadImage,
	updateProduct,
	deleteProduct,
	searchProducts,
	getOrigins
}