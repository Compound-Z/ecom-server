var admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.GOOGLE_CREDS);

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
		timeToLive: 60 * 60 * 24
	};
	const result = await admin.messaging().sendToDevice(registrationToken, message, options)
	console.log('result', result)
	console.log('result', result.results[0].error)

}
const getContent = (orderStatus, orderId) => {
	let subContent = "love you!"

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
	let subContent = "Processing order"

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


module.exports = { sendPushNotiToCustomer }