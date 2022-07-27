const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const uploadFile = require('../utils/fileUploadHelper');
const { addUnderline } = require('../utils/stringHelper')
const Shop = require('../models/Shop')
const Product = require('../models/Product')
var _ = require('underscore')
const mongoose = require('mongoose')
const getShopInfo = async (req, res) => {
	const shopId = req.params.shop_id
	if (!shopId) throw new CustomError.BadRequestError('shopId is missing')

	const shop = await Shop.findOne({ _id: shopId })
	if (!shop) throw new CustomError.NotFoundError('Can not found this shop')

	res.status(StatusCodes.OK).json(shop)
}

/**This api might be duplicated with the getMyProduct api in productController (the difference is that this api is public), but for the sake of speed, just copy past and not refatoring code.
 * Those api should  be refactor later in order to keep maintanace and scalability
 * /shops/:shop_id/products
 */
const getProductsInShop = async (req, res) => {
	const page = req.body.page || 1
	const pageSize = req.body.pageSize || 10
	const shopId = req.params.shop_id
	console.log("getProductsInShop", req.body)

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
/**This api might be duplicated with the getMyProduct api in categoryController(the difference is that this api is public), but for the sake of speed, just copy past and not refatoring code.
 * Those api should  be refactor later in order to keep maintanace and scalability
 * /shops/:shop_id/categories
 */
const getCategoriesInShop = async (req, res) => {
	const shopId = req.params.shop_id
	const shop = await Shop.findOne({ _id: shopId })
		.populate({
			path: 'categories.categoryRef',
			select: { 'name': 1, 'imageUrl': 1 }
		})
	console.log('shop', shop.categories)
	const categories = _.map(shop.categories, function (category) {
		return {
			_id: category.categoryRef._id,
			name: category.categoryRef.name,
			imageUrl: category.categoryRef.imageUrl,
			numberOfProduct: category.numberOfProduct,
			createdAt: category.createdAt,
			updatedAt: category.updatedAt,
		}
	})
	res.status(StatusCodes.OK).json(categories)
}
/**This api might be duplicated with the getMyProduct api in categoryController(the difference is that this api is public), but for the sake of speed, just copy past and not refatoring code.
 * Those api should  be refactor later in order to keep maintanace and scalability
 * /shops/:shop_id/cate-product
 */
const getProductsOfACategoryInShop = async (req, res) => {
	const categoryName = req.body.categoryName
	const shopId = req.params.shop_id
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

	let queryObj = { category: categoryName }
	queryObj['shopId'] = shopId

	const products = await Product.paginate(
		queryObj,
		options
	)
	console.log('products', products)
	if (!products) throw new CustomError.NotFoundError('Not found')

	res.status(StatusCodes.OK).json(products)
}
/**This api might be duplicated with the getMyProduct api in productController(the difference is that this api is public), but for the sake of speed, just copy past and not refatoring code.
 * Those api should  be refactor later in order to keep maintanace and scalability
 * /shops/search/:search_words
 */
const searchProductsInShop = async (req, res) => {
	/**currently, search by compounded text index: category-name */
	/**Todo: Should be search by tags, or description? */
	console.log('search product', req.body)
	const searchWords = req.params.search_words
	const shopId = req.body.shopId

	if (!searchWords) {
		req.params.shop_id = shopId
		await getProductsInShop(req, res)
		return
	}
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
	}).match({ shopId: mongoose.Types.ObjectId(shopId) })
	const products = await Product.aggregatePaginate(aggregate, options)
	console.log('products', products)

	if (!products) throw new CustomError.NotFoundError('Not found')
	res.status(StatusCodes.OK).json(products)
}

const searchProductsOfCategoryInShop = async (req, res) => {
	/**currently, search by compounded text index: category-name */
	/**Todo: Should be search by tags, or description? */
	console.log('search product', req.body)
	const searchWordsProduct = req.params.search_words_product
	console.log('params', req.params.search_words_product)

	const shopId = req.body.shopId
	const searchWordsCategory = req.body.searchWordsCategory
	console.log('searchWordsProduct', searchWordsProduct)

	if (!searchWordsProduct) {
		req.params.shop_id = shopId
		await getProductsInShop(req, res)
		return
	}
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
						query: searchWordsProduct,
						path: 'name'
					},
				}
			],
		}
	}).match({ shopId: mongoose.Types.ObjectId(shopId), category: searchWordsCategory })
	const products = await Product.aggregatePaginate(aggregate, options)
	console.log('products', products)

	if (!products) throw new CustomError.NotFoundError('Not found')
	res.status(StatusCodes.OK).json(products)
}

// const createShop = async (shopInfo) => {
// 	const { name, imageUrl, address } = shopInfo

// 	if (!name || !imageUrl || !address) throw new CustomError.BadRequestError('Please provide required information')

// 	const shop = await Shop.createShop(name, imageUrl, address)
// 	if (!shop) throw new CustomError.InternalServerError('Can not create new shop')

// 	return shop._id
// }

// const createShippingShop = async (shippingShopInfo) => {
// 	const { districtId, wardCode, name, phone, address } = shippingShopInfo

// 	//call ghn api
// }

module.exports = {
	getShopInfo,
	getProductsInShop,
	getCategoriesInShop,
	getProductsOfACategoryInShop,
	searchProductsInShop,
	searchProductsOfCategoryInShop,
}