const {
	getAllProductsInCart,
	addAProductToCart,
	adjustProductQuantityInCart,
	deleteProductInCart,
} = require('../controllers/cartController')

const express = require('express')
const router = express.Router()
const authentication = require('../middleware/authentication')


router.route('/')
	.get(authentication.authenticateUser, getAllProductsInCart)
	.post(authentication.authenticateUser, addAProductToCart)
router.route('/:productDetailId')
	.patch(authentication.authenticateUser, adjustProductQuantityInCart)
	.delete(authentication.authenticateUser, deleteProductInCart)
module.exports = router