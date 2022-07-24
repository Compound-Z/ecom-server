const {
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
} = require('../controllers/productController')

// const { getAllReviewsOfAProduct } = require('../controllers/reviewCotroller')
const express = require('express')
const router = express.Router()
const authentication = require('../middleware/authentication')

router.route('/all')
	.post(getAllProducts)
router.route('/my-products')
	.post(authentication.authenticateUser, authentication.authorizePermissions('admin', 'seller'), getMyProducts)
router.route('/get-one-product/:product_id')
	.get(getOneProduct)
router.route('/')
	.post(authentication.authenticateUser, authentication.authorizePermissions('admin', 'seller'), createProduct)
router.route('/uploadImage')
	.post(uploadImage)

router.route('/search/').post(getAllProducts)
router.route('/search/:search_words').post(searchProducts)

router.route('/origins')
	.get(authentication.authenticateUser, getOrigins)

router.route('/:id')
	.get(getProductDetails)
	.patch(authentication.authenticateUser, authentication.authorizePermissions('admin'), updateProduct)
	.delete(authentication.authenticateUser, authentication.authorizePermissions('admin', 'seller'), deleteProduct)
// router.route('/:id/reviews').get(getAllReviewsOfAProduct)

module.exports = router