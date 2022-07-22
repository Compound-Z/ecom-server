const Category = require('../models/Category')
const Product = require('../models/Product')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const uploadFile = require('../utils/fileUploadHelper');
const { addUnderline } = require('../utils/stringHelper')
const Shop = require('../models/Shop')

const getAllCategories = async (req, res) => {
	const categories = await Category.find({})
	res.status(StatusCodes.OK).json(categories)
}
const getMyCategories = async (req, res) => {
	const shopId = req.user.shopId
	const shop = await Shop.findOne({ _id: shopId })
		.populate({
			path: 'categories.categoryRef',
			select: { 'name': 1, 'imageUrl': 1 }
		})
	console.log('shop', shop.categories)
	res.status(StatusCodes.OK).json(shop.categories)
}
const getAllProductOfACategory = async (req, res) => {
	const categoryName = req.params.name
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
		{ category: categoryName },
		options
	)
	console.log('products', products)
	if (!products) throw new CustomError.NotFoundError('Not found')

	res.status(StatusCodes.OK).json(products)
}
const searchProductsInCategory = async (req, res) => {
	const categoryName = req.params.category_name
	const searchWordsProduct = req.body.searchWordsProduct
	console.log(categoryName, searchWordsProduct)

	if (!searchWordsProduct) {
		req.params.name = categoryName
		await getAllProductOfACategory(req, res)
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

	const aggregate = Product.aggregate()
	aggregate.search({
		autocomplete: {
			query: searchWordsProduct,
			path: 'name'
		}
	}).match({
		category: categoryName
	})

	const products = await Product.aggregatePaginate(aggregate, options)
	console.log('products', products)

	if (!products) throw new CustomError.NotFoundError('Not found')
	res.status(StatusCodes.OK).json(products)
}
const createCategory = async (req, res) => {
	//for now, user will be hardcoded: 
	console.log('body: ', req.body)
	req.body.user = 'test_user_id'

	let { name, imageUrl } = req.body
	name = addUnderline(name)

	const category = await Category.create({
		name, imageUrl
	})

	res.status(StatusCodes.CREATED).json(category)
}

//todo: change to multi file upload?
/**check if category is duplicate, if not, proceed the img uploading process*/
const uploadImage = async (req, res) => {
	await uploadFile(req, res, 'ecom/category')
}
const updateCategory = async (req, res) => {
	const categoryId = req.params.id
	let { name, imageUrl, numberOfProduct } = req.body
	name = addUnderline(name)
	let category = await Category.findOneAndUpdate(
		{ _id: categoryId },
		{ name, imageUrl, numberOfProduct },
		{ new: false, runValidators: true })
	if (!category) {
		throw new CustomError.NotFoundError(`This category with id ${categoryId} does not exist`)
	}

	const updateValue = await Product.updateMany(
		{ "category": category.name },
		{ "category": name }
	)
	if (!updateValue) {
		//revert updating category
		const revertedCategory = await Category.findOneAndUpdate(
			{ _id: categoryId },
			{
				"name": category.name,
				"imageUrl": category.imageUrl,
				"numberOfProduct": category.numberOfProduct
			},
			{ new: true, runValidators: true })
		throw new CustomError.InternalServerError('Failed to update category! Try again later')
	}

	res.status(StatusCodes.OK).json(
		{
			"message": "Update category successfully",
			"modifiedCount": updateValue.modifiedCount,
			"acknowledged": updateValue.acknowledged
		}
	)
}
const deleteCategory = async (req, res) => {
	const categoryId = req.params.id

	const category = await Category.findOne({ _id: categoryId })
	if (!category) {
		throw new CustomError.NotFoundError(`This category with id ${categoryId} does not exist`)
	}
	/**check if there is product that belongs to this category*/
	const products = await Product.find({ "category": category.name })
	console.log('products', products, products.length)
	if (products.length > 0) {
		throw new CustomError.BadRequestError(`Can not delete this category, there are ${products.length} products belong to this category. Update those products first, then try deleting the category later.`)
	} else {
		await category.remove()
		res.status(StatusCodes.OK).json({ message: "remove category successfully" })
	}
}

module.exports = {
	getAllCategories,
	getMyCategories,
	getAllProductOfACategory,
	searchProductsInCategory,
	createCategory,
	uploadImage,
	updateCategory,
	deleteCategory
}