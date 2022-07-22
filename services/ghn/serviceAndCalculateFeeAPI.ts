import GHN from "giaohangnhanh";
const ghn: GHN = new GHN(process.env.GHN_API_KEY_TEST ? process.env.GHN_API_KEY_TEST : "", { test: true })
const serviceAndCalculateFeeAPIAxios = require('./serviceAndCalculateFeeAPIAxios')
const CustomError = require('../../errors');

const calculateFeeOptions = async (
	shopId: number,
	fromDistrictId: number, toDistrictId: number, toWardCode: string,
	weight: number, length: number, width: number, height: number,
	insuranceValue: number) => {
	const services = await serviceAndCalculateFeeAPIAxios.getServices(
		shopId,
		fromDistrictId,
		toDistrictId,
	)
	console.log('services:', services)



	const feeOptions: { service_id: number; name: string; fee: any; }[] = []
	for (const service of services.data) {
		console.log(shopId,
			fromDistrictId, toDistrictId, toWardCode,
			weight, length, width, height,
			insuranceValue, service.service_id)
		const response = await serviceAndCalculateFeeAPIAxios.calculateFee(
			service.service_id,
			fromDistrictId, toDistrictId, toWardCode,
			weight, length, width, height,
			insuranceValue
		)
		console.log('response', response)
		if (response.code == 200)
			feeOptions.push({ service_id: service.service_id, name: service.short_name, fee: response.data })
	}
	console.log('fee options', feeOptions)
	return feeOptions
}
const calculateExpectedDeliveryTime = async (provinceId: number) => {
	return ghn.address.getDistricts(provinceId)
}
const calculateFee = async (
	shippingServiceId: number, fromDistrictId: number,
	toDistrictId: number, toWardCode: string,
	weight: number, length: number, width: number, height: number,
	insuranceValue: number) => {
	console.log('cal fee', shippingServiceId,
		fromDistrictId, toDistrictId, toWardCode,
		weight, length, width, height,
		insuranceValue)
	const response = await serviceAndCalculateFeeAPIAxios.calculateFee(
		shippingServiceId,
		fromDistrictId, toDistrictId, toWardCode,
		weight, length, width, height,
		insuranceValue
	)
	console.log('response', response)
	// const fee = await ghn.service.calculateFee(
	// 	{
	// 		service_id: shippingServiceId,
	// 		insurance_value: insuranceValue,
	// 		to_district_id: toDistrictId,
	// 		to_ward_code: toWardCode,
	// 		weight: weight,
	// 		length: length,
	// 		width: width,
	// 		height: height
	// 	}
	// )
	console.log('response:', response)
	if (!(response.code == 200)) {
		throw new CustomError.BadRequestError(`Shipping service error: ${response.message}`);
	}
	return response.data
}

module.exports = {
	calculateFeeOptions,
	calculateFee,
	calculateExpectedDeliveryTime,
}