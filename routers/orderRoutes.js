const {
	createOrder,
	getShippingFeeOptions,
	getMyOrders,
	getAllOrders,
	getOrderDetails,
	updateOrderStatus,
	cancelOrder,
	searchOrdersByOrderId,
	searchOrdersByUserName,
	getOrdersBaseOnTime,
} = require('../controllers/orderController')

// const { getAllReviewsOfAProduct } = require('../controllers/reviewCotroller')
const express = require('express')
const router = express.Router()
const authentication = require('../middleware/authentication')


router.route('/')
	.post(authentication.authenticateUser, createOrder)
router.route('/all')
	.post(authentication.authenticateUser, authentication.authorizePermissions('admin'), getAllOrders)
// 	.post(authentication.authenticateUser, authentication.authorizePermissions('admin'), createProduct)
router.route('/my-orders')
	.post(authentication.authenticateUser, getMyOrders)
router.route('/shipping-fee')
	.post(authentication.authenticateUser, getShippingFeeOptions)
router.route('/search_by_order_id')
	.post(authentication.authenticateUser, authentication.authorizePermissions('admin'), searchOrdersByOrderId)
router.route('/search_by_user_name')
	.post(authentication.authenticateUser, authentication.authorizePermissions('admin'), searchOrdersByUserName)
router.route('/dashboard')
	.post(authentication.authenticateUser, authentication.authorizePermissions('admin'), getOrdersBaseOnTime)
// router.route('/update-status')
// 	.patch(authentication.authenticateUser, authentication.authorizePermissions('admin'), updateProduct)
// 	.delete(authentication.authenticateUser, authentication.authorizePermissions('admin'), deleteProduct)
// // router.route('/:id/reviews').get(getAllReviewsOfAProduct)
// router.route('/search/:search_words').get(searchProducts)
router.route('/:order_id')
	.get(authentication.authenticateUser, getOrderDetails)
	.patch(authentication.authenticateUser, authentication.authorizePermissions('admin'), updateOrderStatus)
	.delete(authentication.authenticateUser, cancelOrder)

module.exports = router