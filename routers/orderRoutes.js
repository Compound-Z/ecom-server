const {
	getShippingFeeOptions
} = require('../controllers/orderController')

// const { getAllReviewsOfAProduct } = require('../controllers/reviewCotroller')
const express = require('express')
const router = express.Router()
const authentication = require('../middleware/authentication')


// router.route('/')
// 	.get(getAllProducts)
// 	.post(authentication.authenticateUser, authentication.authorizePermissions('admin'), createProduct)
router.route('/shipping-fee')
	.get(authentication.authenticateUser, getShippingFeeOptions)
// router.route('/:id')
// 	.get(getProductDetails)
// 	.patch(authentication.authenticateUser, authentication.authorizePermissions('admin'), updateProduct)
// 	.delete(authentication.authenticateUser, authentication.authorizePermissions('admin'), deleteProduct)
// // router.route('/:id/reviews').get(getAllReviewsOfAProduct)
// router.route('/search/:search_words').get(searchProducts)
module.exports = router