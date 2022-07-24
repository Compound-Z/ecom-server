const axios = require('axios').default;
const token = process.env.GHN_API_KEY_TEST
const getServices = async (
	shopId, fromDistrictId, toDistrictId) => {
	let services = null
	const responsne = await axios.post(
		'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/available-services',
		{
			"shop_id": shopId,
			"from_district": fromDistrictId,
			"to_district": toDistrictId
		}, {
		headers: {
			'Content-Type': 'application/json',
			'Token': token
		}
	}
	)
	services = responsne.data
	return services
}

const calculateFee = async (
	shippingShopId,
	serviceId,
	fromDistrictId, toDistrictId, toWardCode,
	weight, length, width, height,
	insuranceValue) => {
	const response = await axios.post(
		'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee',
		{
			"from_district_id": fromDistrictId,
			"service_id": serviceId,
			"to_district_id": toDistrictId,
			"to_ward_code": toWardCode,
			"height": height,
			"length": length,
			"weight": weight,
			"width": width,
			"insurance_value": insuranceValue
		}, {
		headers: {
			'Content-Type': 'application/json',
			'Token': token,
			'ShopId': shippingShopId
		}
	}
	)

	return response.data
}

module.exports = { getServices, calculateFee }