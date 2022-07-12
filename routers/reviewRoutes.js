const {
	getListReviewQueueProducts,
	createReview,
	updateReview,
} = require('../controllers/reviewController')

// const { getAllReviewsOfAProduct } = require('../controllers/reviewCotroller')
const express = require('express')
const router = express.Router()
const authentication = require('../middleware/authentication')

router.route('/my-review-queue')
	.post(authentication.authenticateUser, getListReviewQueueProducts)
router.route('/')
	.post(authentication.authenticateUser, createReview)
// router.route('/uploadImage')
// 	.post(authentication.authenticateUser, authentication.authorizePermissions('admin'), uploadImage)

// router.route('/search/').post(getAllProducts)
// router.route('/search/:search_words').post(searchProducts)

// router.route('/origins')
// 	.get(authentication.authenticateUser, getOrigins)

router.route('/:review_id')
	// 	.get(getProductDetails)
	.patch(authentication.authenticateUser, updateReview)
// 	.delete(authentication.authenticateUser, authentication.authorizePermissions('admin'), deleteProduct)
// // router.route('/:id/reviews').get(getAllReviewsOfAProduct)

module.exports = router