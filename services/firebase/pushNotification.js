var admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.GOOGLE_CREDS);
const { fcmTTL } = require('../../utils/constants')
const User = require('../../models/User')
const CustomError = require('../../errors');
const Shop = require('../../models/Shop')

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount)
});

const sendPushNotiToCustomer = async (user, order) => {
	const title = getTitle(order.status)
	const content = getContent(order.status, order.orderId)
	const orderId = order._id.toString()
	const registrationToken = user.fcmToken
	const imageUrl = order.orderItems[0].imageUrl
	const message = {
		data: {
			title,
			content,
			orderId,
			imageUrl
		},
	}
	const options = {
		priority: "high",
		timeToLive: fcmTTL
	};
	const result = await admin.messaging().sendToDevice(registrationToken, message, options)
	console.log('result', result)
	console.log('result', result.results[0].error)
}

const sendPushNotiToAdmins = async (user, orders) => {
	const userName = user.name

	for (const order of orders) {
		const title = getTitleAdmin(order.status)
		const content = getContentAdmin(userName, order.status, order.orderId, order.billing.subTotal)
		const orderId = order._id.toString()
		const imageUrl = order.orderItems[0].imageUrl

		//get seller info
		const shop = await Shop.findOne({ _id: order.shopRef }).populate('userId')
		if (!shop) {
			console.log('Can not find shop to send notification')
			throw new CustomError.NotFoundError('Can not find shop to send notification')
		}
		const seller = shop.userId
		const registrationToken = seller?.fcmToken ? seller.fcmToken : "dummy"
		const message = {
			data: {
				title,
				content,
				orderId,
				imageUrl
			},
		}
		const options = {
			priority: "high",
			timeToLive: fcmTTL
		};

		const result = await admin.messaging().sendToDevice(registrationToken, message, options)
		console.log('result', result)
	}

}
const getContent = (orderStatus, orderId) => {
	let subContent = "Order updated!"

	switch (orderStatus) {
		case "PROCESSING":
			subContent = `is processing your order ${orderId}`
			break;
		case "CONFIRMED":
			subContent = `has confirmed your order ${orderId}`
			break;
		default:
			break;
	}
	return `Shop ${subContent}`
}

const getTitle = (orderStatus) => {
	let subContent = "Order"

	switch (orderStatus) {
		case "PROCESSING":
			subContent = "Processing order"
			break;
		case "CONFIRMED":
			subContent = "Confirmed order"
			break;
		default:
			break;
	}
	return subContent
}
const getContentAdmin = (userName, orderStatus, orderId, total) => {
	let subContent = "Order updated!"

	switch (orderStatus) {
		case "PENDING":
			subContent = `${userName} has place an order ${orderId}. \nTotal: ${total}đ`
			break;
		case "CANCELED":
			subContent = `${userName} has canceled an order ${orderId}.`
			break;
		default:
			break;
	}
	return `${subContent}`
}

const getTitleAdmin = (orderStatus) => {
	let subContent = "Order"

	switch (orderStatus) {
		case "PENDING":
			subContent = "New order"
			break;
		case "CANCELED":
			subContent = "Oder canceled"
			break;
		default:
			break;
	}
	return subContent
}

module.exports = { sendPushNotiToCustomer, sendPushNotiToAdmins }