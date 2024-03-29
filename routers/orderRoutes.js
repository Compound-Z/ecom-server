const {
	createOrder,
	getShippingFeeOptions,
	getMyOrders,
	getAllOrders,
	getOrderDetails,
	updateOrderStatus,
	cancelOrder,
	receiveOrder,
	searchOrdersByOrderId,
	searchOrdersByUserName,
	getOrdersBaseOnTime,
} = require('../controllers/orderController')

// const { getAllReviewsOfAProduct } = require('../controllers/reviewCotroller')
const express = require('express')
const router = express.Router()
const authentication = require('../middleware/authentication')


router.route('/')
	.post(authentication.authenticateUser, authentication.authorizePermissions('customer'), createOrder)
router.route('/all')
	.post(authentication.authenticateUser, authentication.authorizePermissions('admin'), getAllOrders)
// 	.post(authentication.authenticateUser, authentication.authorizePermissions('admin'), createProduct)
router.route('/my-orders')
	.post(authentication.authenticateUser, getMyOrders)
router.route('/shipping-fee')
	.post(authentication.authenticateUser, getShippingFeeOptions)
router.route('/search_by_order_id')
	.post(authentication.authenticateUser, authentication.authorizePermissions('admin', 'seller'), searchOrdersByOrderId)
router.route('/search_by_user_name')
	.post(authentication.authenticateUser, authentication.authorizePermissions('admin', 'seller'), searchOrdersByUserName)
router.route('/dashboard')
	.post(authentication.authenticateUser, authentication.authorizePermissions('admin', 'seller'), getOrdersBaseOnTime)
// router.route('/update-status')
// 	.patch(authentication.authenticateUser, authentication.authorizePermissions('admin'), updateProduct)
// 	.delete(authentication.authenticateUser, authentication.authorizePermissions('admin'), deleteProduct)
// // router.route('/:id/reviews').get(getAllReviewsOfAProduct)
// router.route('/search/:search_words').get(searchProducts)
router.route('/:order_id')
	.get(authentication.authenticateUser, getOrderDetails)
	.patch(authentication.authenticateUser, updateOrderStatus)
	.delete(authentication.authenticateUser, authentication.authorizePermissions('customer'), cancelOrder)

module.exports = router