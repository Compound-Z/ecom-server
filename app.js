/*REQUIRE*/
require('dotenv').config();
require('express-async-errors')

const express = require('express')
const app = express()
//morgan: http request logger
const morgan = require('morgan')
//fileupload
const fileUpload = require('express-fileupload');
// USE V2
const cloudinary = require('cloudinary').v2;
cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.CLOUD_API_KEY,
	api_secret: process.env.CLOUD_API_SECRET,
});

//db
const connectDB = require('./db/connect')

//middleware
const notFound = require('./middleware/not-found')
const errorHandlerMiddleware = require('./middleware/error-handler')

//routes
const authRouter = require('./routers/authRoutes');
const routerProduct = require('./routers/productRoutes')
const categoryRouter = require('./routers/categoryRoutes')
const cartRouter = require('./routers/cartRoute')
const addressRouter = require('./routers/addressRoutes')
const orderRouter = require('./routers/orderRoutes')


/*USE*/
app.use(morgan('tiny'))
app.use(express.json())


app.use(fileUpload({ useTempFiles: true }));

app.get('/', (req, res) => {
	res.send('OKE')
})
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', routerProduct)
app.use('/api/v1/categories', categoryRouter)
app.use('/api/v1/cart', cartRouter)
app.use('/api/v1/addresses', addressRouter)
app.use('/api/v1/orders', orderRouter)

app.use(notFound)
app.use(errorHandlerMiddleware)


const port = process.env.PORT || 5000
const start = async () => {
	try {
		await connectDB(process.env.MONGO_URI)


		app.listen(port, () => {
			console.log(`Server is running at ${port}...`);
		})
	} catch (error) {
		console.log(`Error while starting server: ${error}`);
	}
}
start()