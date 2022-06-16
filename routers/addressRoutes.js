const {
	getAllAddresses,
	getListProvinces,
} = require('../controllers/addressController')

const express = require('express')
const router = express.Router()
const authentication = require('../middleware/authentication')

router.route('/')
	.get(authentication.authenticateUser, getAllAddresses)
// .post(authentication.authenticateUser, authentication.authorizePermissions('admin'), createProduct)
router.route('/provinces')
	.get(authentication.authenticateUser, getListProvinces)
// router.route('/:id')
// 	.get(getProductDetails)
// 	.patch(authentication.authenticateUser, authentication.authorizePermissions('admin'), updateProduct)
// 	.delete(authentication.authenticateUser, authentication.authorizePermissions('admin'), deleteProduct)
// // router.route('/:id/reviews').get(getAllReviewsOfAProduct)
// router.route('/search/:search_words').get(searchProducts)
module.exports = router