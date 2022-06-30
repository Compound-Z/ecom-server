const {
	getAllProducts,
	getProductDetails,
	createProduct,
	uploadImage,
	updateProduct,
	deleteProduct,
	searchProducts,
	getOrigins
} = require('../controllers/productController')

// const { getAllReviewsOfAProduct } = require('../controllers/reviewCotroller')
const express = require('express')
const router = express.Router()
const authentication = require('../middleware/authentication')


router.route('/')
	.get(getAllProducts)
	.post(authentication.authenticateUser, authentication.authorizePermissions('admin'), createProduct)
router.route('/uploadImage')
	.post(authentication.authenticateUser, authentication.authorizePermissions('admin'), uploadImage)

router.route('/search/').get(getAllProducts)
router.route('/search/:search_words').get(searchProducts)

router.route('/origins')
	.get(authentication.authenticateUser, getOrigins)

router.route('/:id')
	.get(getProductDetails)
	.patch(authentication.authenticateUser, authentication.authorizePermissions('admin'), updateProduct)
	.delete(authentication.authenticateUser, authentication.authorizePermissions('admin'), deleteProduct)
// router.route('/:id/reviews').get(getAllReviewsOfAProduct)

module.exports = router