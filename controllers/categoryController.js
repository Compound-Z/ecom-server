const Category = require('../models/Category')
const Product = require('../models/Product')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const uploadFile = require('../utils/fileUploadHelper')


const getAllCategories = async (req, res) => {
	const categories = await Category.find({})
	res.status(StatusCodes.OK).json(categories)
}
const getAllProductOfACategory = async (req, res) => {
	const categoryName = req.params.name
	const products = await Product.find({ category: categoryName })
	res.status(StatusCodes.OK).json({ products })
}
const createCategory = async (req, res) => {
	//for now, user will be hardcoded: 
	console.log('body: ', req.body)
	req.body.user = 'test_user_id'

	const { name, imageUrl, numberOfProduct } = req.body

	const category = await Category.create({
		name, imageUrl, numberOfProduct
	})

	res.status(StatusCodes.CREATED).json(category)
}

//todo: change to multi file upload?
const uploadImage = async (req, res) => {
	uploadFile(req, res, '10-ecom/category')
}
const updateCategory = async (req, res) => {
	const categoryId = req.params.id
	const { name, imageUrl, numberOfProduct } = req.body
	const category = await Category.findOneAndUpdate(
		{ _id: categoryId },
		{ name, imageUrl, numberOfProduct },
		{ new: true, runValidators: true })

	if (!category) {
		throw new CustomError.NotFoundError(`This category with id ${categoryId} does not exist`)
	}

	res.status(StatusCodes.OK).json(category)
}
const deleteCategory = async (req, res) => {
	const categoryId = req.params.id

	const category = await Category.findOne({ _id: categoryId })
	if (!category) {
		throw new CustomError.NotFoundError(`This category with id ${categoryId} does not exist`)
	}

	await category.remove()
	res.status(StatusCodes.OK).json({ msg: "remove category successfully" })
}

module.exports = {
	getAllCategories,
	getAllProductOfACategory,
	createCategory,
	uploadImage,
	updateCategory,
	deleteCategory
}