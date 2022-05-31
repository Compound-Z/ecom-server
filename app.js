/*REQUIRE*/
require('dotenv').config();
require('express-async-errors')

const express = require('express')
const app = express()
//morgan: http request logger
const morgan = require('morgan')

//db
const connectDB = require('./db/connect')

//middleware
const notFound = require('./middleware/not-found')
const errorHandlerMiddleware = require('./middleware/error-handler')

//routes
const authRouter = require('./routers/authRoutes');
const routerProduct = require('./routers/productRoutes')


/*USE*/
app.use(morgan('tiny'))
app.use(express.json())



app.get('/', (req, res) => {
	res.send('OKE')
})
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', routerProduct)

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