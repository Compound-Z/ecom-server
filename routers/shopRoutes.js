const {
	getShopInfo,
	getProductsInShop,
	getCategoriesInShop,
	getProductsOfACategoryInShop,
	searchProductsInShop
} = require('../controllers/shopController')

const express = require('express')
const router = express.Router()
const authentication = require('../middleware/authentication')

router.route('/search')
	.post(searchProductsInShop)
router.route('/search/:search_words')
	.post(searchProductsInShop)
router.route('/:shop_id')
	.get(getShopInfo)
router.route('/:shop_id/products')
	.post(getProductsInShop)
router.route('/:shop_id/categories')
	.get(getCategoriesInShop)
router.route('/:shop_id/cate-products')
	.post(getProductsOfACategoryInShop)



// router.route('/:id')
// 	.get(getProductDetails)
// 	.patch(authentication.authenticateUser, authentication.authorizePermissions('seller'), updateProduct)
// 	.delete(authentication.authenticateUser, authentication.authorizePermissions('admin', 'seller'), deleteProduct)
// // router.route('/:id/reviews').get(getAllReviewsOfAProduct)

module.exports = router