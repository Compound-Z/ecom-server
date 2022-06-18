import GHN from "giaohangnhanh";
const ghn: GHN = new GHN(process.env.GHN_API_KEY_TEST ? process.env.GHN_API_KEY_TEST : "", { test: true })
const serviceAndCalculateFeeAPIAxios = require('./serviceAndCalculateFeeAPIAxios')
const CustomError = require('../../errors');

const calculateFeeOptions = async (
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
const calculateFee = async (
	shippingServiceId: number,
	fromDistrictId: number, toDistrictId: number, toWardCode: string,
	weight: number, length: number, width: number, height: number,
	insuranceValue: number) => {

	const shopId = parseInt(process.env.SHOP_ID + '')

	const fee = await ghn.service.calculateFee(
		shopId,
		{
			service_id: shippingServiceId,
			insurance_value: insuranceValue,
			to_district_id: toDistrictId,
			to_ward_code: toWardCode,
			weight: weight,
			length: length,
			width: width,
			height: height
		}
	)
	console.log('fee:', fee)
	if (fee.message) {
		throw new CustomError.BadRequestError(`Shipping service error: ${fee.message}`);
	}
	return fee
}

module.exports = {
	calculateFeeOptions,
	calculateFee,
	calculateExpectedDeliveryTime,
}