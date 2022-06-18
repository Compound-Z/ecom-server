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

module.exports = { getServices }