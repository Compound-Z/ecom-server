const {
	getAllAddresses,
	createAddress,
	editAddressItem,
	deleteAddressItem,
	getProvinces,
	getDistricts,
	getWards,
} = require('../controllers/addressController')

const express = require('express')
const router = express.Router()
const authentication = require('../middleware/authentication')

router.route('/')
	.get(authentication.authenticateUser, getAllAddresses)
	.post(authentication.authenticateUser, createAddress)
router.route('/provinces')
	.get(getProvinces)
router.route('/districts/:province_id')
	.get(getDistricts)
router.route('/wards/:district_id')
	.get(getWards)
router.route('/:address_item_id')
	.patch(authentication.authenticateUser, editAddressItem)
	.delete(authentication.authenticateUser, deleteAddressItem)
// router.route('/:id')
// 	.get(getProductDetails)
// 	.patch(authentication.authenticateUser, authentication.authorizePermissions('admin'), updateProduct)
// 	.delete(authentication.authenticateUser, authentication.authorizePermissions('admin'), deleteProduct)
// // router.route('/:id/reviews').get(getAllReviewsOfAProduct)
// router.route('/search/:search_words').get(searchProducts)
module.exports = router