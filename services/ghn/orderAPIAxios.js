const axios = require('axios').default;
const token = process.env.GHN_API_KEY_TEST

const createOrder = async (
	shopId, order) => {
	const fullAddress = `${order.address.detailedAddress}, ${order.address.ward.name}, ${order.address.district.name}, ${order.address.province.name}`

	const response = await axios.post(
		'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create',
		{
			"to_name": order.user.name,
			"to_phone": order.user.phoneNumber,
			"to_address": fullAddress,
			"to_ward_code": order.address.ward.code,
			"to_district_id": order.address.district.districtId,
			"service_id": order.shippingDetails.shippingServiceId,
			"content": "Thái Ngà Shop",
			"weight": order.shippingDetails.weight,
			"length": shipping.PACKAGE_LENGTH_DEFAULT,
			"width": shipping.PACKAGE_WIDTH_DEFAULT,
			"height": shipping.PACKAGE_HEIGHT_DEFAULT,
			"payment_type_id": 2,
			"required_note": "KHONGCHOXEMHANG",
			"cod_amount": order.billing.subTotal,
			"insurance_value": order.billing.subTotal,
			"note": order.note,
			"items": order.orderItems
		}, {
		headers: {
			'Content-Type': 'application/json',
			'Token': token,
			'ShopId': shopId,
		}
	}
	)
	console.log('axios', response)
	return response.data
}

module.exports = { createOrder }