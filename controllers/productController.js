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
	const page = req.body.page || 1
	const pageSize = req.body.pageSize || 10
	const options = {
		sort: {
			updatedAt: -1
		},
		page: page,
		limit: pageSize,
		select: '-user -createdAt -updatedAt -__v -id',
	}
	const products = await Product.paginate(
		{},
		options
	)

	if (!products) throw new CustomError.NotFoundError('Not found')
	res.status(StatusCodes.OK).json(products)
}

const getMyProducts = async (req, res) => {
	const page = req.body.page || 1
	const pageSize = req.body.pageSize || 10
	const shopId = req.user.shopId
	const options = {
		sort: {
			updatedAt: -1
		},
		page: page,
		limit: pageSize,
		select: '-user -createdAt -updatedAt -__v -id',
	}
	const products = await Product.paginate(
		{ shopId },
		options
	)

	if (!products) throw new CustomError.NotFoundError('Not found')
	res.status(StatusCodes.OK).json(products)
}

const getOneProduct = async (req, res) => {
	const productId = req.params.product_id
	if (!productId) throw new CustomError.BadRequestError('productId is missing')

	const product = await Product.findOne({ _id: productId })
	if (!product) throw new CustomError.NotFoundError('Can not found this product')

	res.status(StatusCodes.OK).json(product)
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
	const shopId = req.user.shopId
	console.log('shopId', shopId)
	// const productReq = req.body.product
	// const productDetailReq = req.body.productDetail

	console.log("Req:", productDetailReq)
	if (!productReq || !productDetailReq || !shopId) {
		throw new CustomError.BadRequestError('productReq, productDetailReq or shopId is missing')
	}
	productReq.shopId = shopId
	productDetailReq.shopId = shopId
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

	res.status(StatusCodes.CREATED).json(product)
}

//todo: change to multi file upload?
const uploadImage = async (req, res) => {
	uploadFile(req, res, 'ecom/product')
}
const updateProduct = async (req, res) => {
	const productId = req.params.id
	const { product: productReq, productDetail: productDetailReq } = req.body
	if (productReq) {
		if (productReq.category) {
			productReq.category = addUnderline(productReq.category)
		}
	}
	const oldProduct = await Product.findOne({ _id: productId })
	if (!oldProduct) {
		throw new CustomError.NotFoundError(`This product with id ${productId} does not exist`)
	}
	const oldCate = oldProduct.category

	const product = await Product.findOneAndUpdate(
		{ _id: productId },
		productReq,
		{ new: true, runValidators: true })

	if (!product) {
		throw new CustomError.NotFoundError(`This product with id ${productId} does not exist`)
	}

	if (!(product.category === oldCate)) {
		/**update cate */
		/**increase numberOfProduct */
		const productsOls = await Product.find({ category: oldCate })
		const oldCateUpdate = await Category.findOneAndUpdate({ name: oldCate }, { numberOfProduct: productsOls.length }, { new: true, runValidators: true })
		/**decrease numberOfProduct until 0*/
		const productsNew = await Product.find({ category: product.category })
		const newCateUpdate = await Category.findOneAndUpdate({ name: product.category }, { numberOfProduct: productsNew.length }, { new: true, runValidators: true })
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
	const shopId = req.user.shopId
	const product = await Product.findOne({ _id: productId, shopId })
	if (!product) {
		throw new CustomError.NotFoundError(`This product with id ${productId} does not exist`)
	}
	await product.remove()

	const productDetail = await ProductDetail.findOneAndDelete({ productId: productId, shopId })
	if (!productDetail) {
		throw new CustomError.NotFoundError(`This productDetail does not exist`)
	}

	res.status(StatusCodes.OK).json({ message: "remove product successfully" })
}

const searchProducts = async (req, res) => {
	/**currently, search by compounded text index: category-name */
	/**Todo: Should be search by tags, or description? */
	console.log('search product', req.body)
	const searchWords = req.params.search_words
	const page = req.body.page || 1
	const pageSize = req.body.pageSize || 10
	const options = {
		sort: {
			updatedAt: -1
		},
		page: page,
		limit: pageSize,
		select: '-user -createdAt -updatedAt -__v -id',
	}
	/**autocomplete search by name, category using Atlas search index instead of text index*/
	const aggregate = Product.aggregate()
	aggregate.search({
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
	})
	const products = await Product.aggregatePaginate(aggregate, options)
	console.log('products', products)

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
	getMyProducts,
	getProductDetails,
	createProduct,
	uploadImage,
	updateProduct,
	deleteProduct,
	searchProducts,
	getOrigins,
	getOneProduct
}