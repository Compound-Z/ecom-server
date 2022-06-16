const Address = require('../models/Address')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
//GHN
import GHN from 'giaohangnhanh'
const ghn = new GHN(process.env.GHN_API_KEY_TEST, { test: true });

const getAllAddresses = async (req, res) => {
	const addresses = await Address.find({
		userId
	})
	res.status(StatusCodes.OK).json(addresses)
}

const getListProvinces = async (req, res) => {
	const provinces = await ghn.address.getProvinces();
	res.status(StatusCodes.OK).json(provinces)
}

// const addAddress = async (req, res) => {
// 	//for now, user will be hardcoded: 
// 	console.log('body: ', req.body)
// 	req.body.user = 'test_user_id'

// 	const { name, imageUrl, numberOfProduct } = req.body

// 	const category = await Category.create({
// 		name, imageUrl, numberOfProduct
// 	})

// 	res.status(StatusCodes.CREATED).json(category)
// }

// //todo: change to multi file upload?
// const uploadImage = async (req, res) => {
// 	uploadFile(req, res, '10-ecom/category')
// }
// const updateCategory = async (req, res) => {
// 	const categoryId = req.params.id
// 	const { name, imageUrl, numberOfProduct } = req.body
// 	const category = await Category.findOneAndUpdate(
// 		{ _id: categoryId },
// 		{ name, imageUrl, numberOfProduct },
// 		{ new: true, runValidators: true })

// 	if (!category) {
// 		throw new CustomError.NotFoundError(`This category with id ${categoryId} does not exist`)
// 	}

// 	res.status(StatusCodes.OK).json(category)
// }
// const deleteCategory = async (req, res) => {
// 	const categoryId = req.params.id

// 	const category = await Category.findOne({ _id: categoryId })
// 	if (!category) {
// 		throw new CustomError.NotFoundError(`This category with id ${categoryId} does not exist`)
// 	}

// 	await category.remove()
// 	res.status(StatusCodes.OK).json({ msg: "remove category successfully" })
// }

module.exports = {
	getAllAddresses,
	getListProvinces,
	// createCategory,
	// uploadImage,
	// updateCategory,
	// deleteCategory
}