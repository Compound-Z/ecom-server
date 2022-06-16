import GHN from "giaohangnhanh";
const ghn: GHN = new GHN(process.env.GHN_API_KET_TEST ? process.env.GHN_API_KET_TEST : "", { test: true })
const getProvinces = async () => {
	return ghn.address.getProvinces()
}

const getDistricts = async (provinceId: number) => {
	return ghn.address.getDistricts(provinceId)
}

const getWards = async (districtId: number) => {
	return ghn.address.getWards(districtId)
}

module.exports = {
	getProvinces,
	getDistricts,
	getWards
}