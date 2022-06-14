const {
	getAllCategories,
	getAllProductOfACategory,
	createCategory,
	uploadImage,
	updateCategory,
	deleteCategory
} = require('../controllers/categoryController')

// const { getAllReviewsOfACategory } = require('../controllers/reviewCotroller')
const express = require('express')
const router = express.Router()
const authentication = require('../middleware/authentication')


router.route('/')
	.get(getAllCategories)
	.post(authentication.authenticateUser,/* authentication.authorizeUserPermission('admin'),*/ createCategory)
router.route('/uploadImage')
	.post(/*authentication.authenticateUser, authentication.authorizeUserPermission('admin'), */uploadImage)
router.route('/:id')
	.patch(/*authentication.authenticateUser, authentication.authorizeUserPermission('admin'), */updateCategory)
	.delete(/*authentication.authenticateUser, authentication.authorizeUserPermission('admin'),*/ deleteCategory)
router.route('/:name/products').get(getAllProductOfACategory)
module.exports = router