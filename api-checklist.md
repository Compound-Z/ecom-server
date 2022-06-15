# User
- [x] register
- [x] verifyOTP
- [x] login
- [x] logout
- [x] refreshToken
- [x] forgotPassword
- [x] resetPassword
# Product
- [x] getAllProducts
- [x] getProductDetails
- [x] createProduct
- [x] updateProduct
- [x] deleteProduct
- [x] uploadImage
- [x] searchProduct

# Category
- [x] getAllCategories,
- [x] getAllProductOfACategory,
- [x] createCategory,
- [x] uploadImage,
- [x] updateCategory,
- [x] deleteCategory

# Cart
- [x] addAProductToCart,
- [x] getAllProductsInCart
- [x] deleteAProductFromCart,
- [x] adjustProductNumberInCart,

# Order
- [] createOrder
- [] cancelOrder | need to provide reason why cancel the order
- [] confirmOrder | when confirming an order, create a shipping order
- [] updateOrderStatus | mark order as paid after completing paymet process.
//list active order and order history should be separated: Subset pattern
- [] getListActiveOrder
- [] getOrderHistory

# Payment
- [] createPaymentOrder | assign paymentOrderId to order
- [] onZaloPayCallback | update order status
- [] checkPaymentOrderStatus | periodically check after 15 
minutes without callback from ZaloPay server
- [] infromPaymentStatus | client send information after completing payment (app2app)

# Shipping
- [] createShippingOrder
- [] checkShippingStatus
- [] 
# Review
- [] getAllReviewsOfAProduct,
- [] createReview,
- [] updateReview,
- [] deleteReview