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
	.get(authentication.authenticateUser, authentication.authorizePermissions('customer'), getAllProductsInCart)
	.post(authentication.authenticateUser, authentication.authorizePermissions('customer'), addAProductToCart)
router.route('/:productId')
	.patch(authentication.authenticateUser, adjustProductQuantityInCart)
	.delete(authentication.authenticateUser, deleteProductInCart)
module.exports = router