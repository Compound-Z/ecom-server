import GHN from "giaohangnhanh";
const ghn: GHN = new GHN(process.env.GHN_API_KET_TEST ? process.env.GHN_API_KET_TEST : "", { test: true })
const calculateFee = async (
	fromDistrictId: number, toDistrictId: number, toWardCode: string,
	weight: number, length: number, width: number, height: number,
	insuranceValue: number) => {
	const shopId = parseInt(process.env.SHOP_ID + '')
	const services = await ghn.service.getServices(shopId, fromDistrictId, toDistrictId)

	const feeOptions: { service_id: number; name: string; fee: any; }[] = []
	services.array.forEach(async (service: { service_id: number; name: string; }) => {
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
		feeOptions.push({ service_id: service.service_id, name: service.name, fee })
	});
	return feeOptions
}
const calculateExpectedDeliveryTime = async (provinceId: number) => {
	return ghn.address.getDistricts(provinceId)
}


module.exports = {
	calculateFee,
	calculateExpectedDeliveryTime,
}