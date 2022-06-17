import GHN from "giaohangnhanh";
const ghn: GHN = new GHN(process.env.GHN_API_KEY ? process.env.GHN_API_KEY : "", { test: false })
const serviceAndCalculateFeeAPIAxios = require('./serviceAndCalculateFeeAPIAxios')
const calculateFee = async (
	fromDistrictId: number, toDistrictId: number, toWardCode: string,
	weight: number, length: number, width: number, height: number,
	insuranceValue: number) => {
	const shopId = parseInt(process.env.SHOP_ID + '')

	const services = await serviceAndCalculateFeeAPIAxios.getServices(
		shopId,
		fromDistrictId,
		toDistrictId,
	)
	console.log('services:', services)

	const feeOptions: { service_id: number; name: string; fee: any; }[] = []
	console.log('service:', services)
	for (const service of services.data) {
		const fee = await ghn.service.calculateFee(
			shopId,
			{
				service_id: service.service_id,
				insurance_value: insuranceValue,
				to_district_id: toDistrictId,
				to_ward_code: toWardCode,
				weight: weight,
				length: length,
				width: width,
				height: height
			}
		)
		console.log('fee', fee)
		if (!fee.message)
			feeOptions.push({ service_id: service.service_id, name: service.short_name, fee })
	}
	return feeOptions
}
const calculateExpectedDeliveryTime = async (provinceId: number) => {
	return ghn.address.getDistricts(provinceId)
}


module.exports = {
	calculateFee,
	calculateExpectedDeliveryTime,
}