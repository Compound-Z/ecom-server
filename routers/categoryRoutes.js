const {
	getAllCategories,
	getMyCategories,
	getAllProductOfACategory,
	searchProductsInCategory,
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
	.post(authentication.authenticateUser, authentication.authorizePermissions('admin'), createCategory)
router.route('/my-categories')
	.get(authentication.authenticateUser, authentication.authorizePermissions('seller'), getMyCategories)
router.route('/uploadImage')
	.post(authentication.authenticateUser, authentication.authorizePermissions('admin'), uploadImage)
router.route('/search/:category_name')
	.post(authentication.authenticateUser, searchProductsInCategory)
router.route('/:id')
	.patch(authentication.authenticateUser, authentication.authorizePermissions('admin'), updateCategory)
	.delete(authentication.authenticateUser, authentication.authorizePermissions('admin'), deleteCategory)
router.route('/:name').post(getAllProductOfACategory)
module.exports = router