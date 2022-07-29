const { Address } = require('../models/Address')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const ghnAPI = require('../services/ghn/ghnAPI');
const { findOneAndUpdate } = require('../models/Address');

const getAllAddresses = async (req, res) => {
	let addresses = await Address.findOne({
		userId: req.user.userId
	})
	if (addresses == null) addresses = {}
	res.status(StatusCodes.OK).json(addresses)
}
const createAddress = async (req, res) => {
	const userId = req.user.userId
	const {
		provinceId, districtId, wardCode, detailedAddress, isDefaultAddress,
		receiverName, receiverPhoneNumber } = req.body

	let address = await Address.findOne({
		userId
	})
	const { province, district, ward } = await getAndCheckAddress(provinceId, districtId, wardCode)

	const addressItem = getAddressItemObj(provinceId, province, districtId, district, wardCode, ward, detailedAddress, receiverName, receiverPhoneNumber)

	if (!address) {
		//create new address object on db with one address item
		address = await Address.create({
			userId,
			addresses: [addressItem]
		})
		if (!address) throw new CustomError.ThirdPartyServiceError('Can not create address')
		address.defaultAddressId = address.addresses[0]._id
		await address.save()
		res.status(StatusCodes.CREATED).json(address)
	} else {
		//push new address item
		address = await Address.findOneAndUpdate({
			userId
		}, {
			$push: {
				addresses: addressItem
			}
		}, { new: true, runValidators: true }
		)
		if (!address) throw new CustomError.NotFoundError('Can not find address')
		console.log(address, address.addresses.length, address.addresses.length == 1)
		/**if this address is marked as default or it is the first address to be created, mark it as default addresss */
		if (isDefaultAddress || address.addresses.length == 1) address.defaultAddressId = address.addresses[address.addresses.length - 1].id
		await address.save()
		res.status(StatusCodes.OK).json(address)
	}
}
const editAddressItem = async (req, res) => {
	const userId = req.user.userId
	const addressItemId = req.params.address_item_id
	const {
		provinceId, districtId, wardCode, detailedAddress, isDefaultAddress,
		receiverName, receiverPhoneNumber } = req.body

	const { province, district, ward } = await getAndCheckAddress(provinceId, districtId, wardCode)
	const newAddressItem = getAddressItemObj(provinceId, province, districtId, district, wardCode, ward, detailedAddress, receiverName, receiverPhoneNumber)
	let address = null
	if (!isDefaultAddress) {
		address = await Address.findOneAndUpdate({
			userId,
			"addresses._id": addressItemId,
		}, {
			$set: {
				"addresses.$.receiverName": newAddressItem.receiverName,
				"addresses.$.receiverPhoneNumber": newAddressItem.receiverPhoneNumber,
				"addresses.$.province": newAddressItem.province,
				"addresses.$.district": newAddressItem.district,
				"addresses.$.ward": newAddressItem.ward,
				"addresses.$.detailedAddress": newAddressItem.detailedAddress,
			}
		}, { new: true, runValidators: true }
		)
		if (!address) throw new CustomError.NotFoundError('Can not find address')
	} else {
		address = await Address.findOneAndUpdate({
			userId,
			"addresses._id": addressItemId,
		}, {
			$set: {
				"addresses.$.receiverName": newAddressItem.receiverName,
				"addresses.$.receiverPhoneNumber": newAddressItem.receiverPhoneNumber,
				"addresses.$.province": newAddressItem.province,
				"addresses.$.district": newAddressItem.district,
				"addresses.$.ward": newAddressItem.ward,
				"addresses.$.detailedAddress": newAddressItem.detailedAddress,
				defaultAddressId: addressItemId
			}
		}, { new: true, runValidators: true }
		)
		if (!address) throw new CustomError.NotFoundError('Can not find address')
		address.defaultAddressId = addressItemId
		await address.save()
	}

	if (!address) throw new CustomError.NotFoundError('This address does not exist')

	res.status(StatusCodes.OK).json(address)
}

const deleteAddressItem = async (req, res) => {
	const userId = req.user.userId
	const addressItemId = req.params.address_item_id
	let address = await Address.findOne({
		userId,
		"addresses._id": addressItemId
	})
	if (!address) throw new CustomError.NotFoundError('Can not find address')

	if (address.defaultAddressId === addressItemId) {
		throw new CustomError.BadRequestError('Can not delete default address')
	} else {
		address = await Address.findOneAndUpdate(
			{
				userId,
				"addresses._id": addressItemId
			}, {
			$pull: {
				addresses: {
					_id: addressItemId
				}
			}
		}, { new: true, runValidators: true }
		)
		if (!address) {
			throw new CustomError.NotFoundError(`Address or cart doesn\'t exist`)
		}
		res.status(StatusCodes.OK).json(address)
	}
}
const getAddressItemObj = (provinceId, province, districtId, district, wardCode, ward, detailedAddress, receiverName, receiverPhoneNumber) => {
	return {
		receiverName,
		receiverPhoneNumber,
		province: {
			provinceId,
			name: province.name,
			code: province.code,
		},
		district: {
			districtId,
			provinceId,
			name: district.name,
			code: district.code,
		},
		ward: {
			districtId,
			name: ward.name,
			code: ward.code,
		},
		detailedAddress
	}
}
const getAndCheckAddress = async (provinceId, districtId, wardCode) => {
	/**get address info from ghn api */
	const provinces = await ghnAPI.addressAPI.getProvinces()
	if (provinces.message) throw new CustomError.InternalServerError('Can not find provinces')
	console.log("provinces:", provinces)
	let province = null
	provinces.every(item => {
		if (item.province_id === provinceId) {
			province = item
			return false
		}
		return true
	});
	if (!province) throw new CustomError.NotFoundError('Can not find province')
	const districts = await ghnAPI.addressAPI.getDistricts(provinceId)
	if (districts.message) throw new CustomError.InternalServerError('Can not find districts')

	let district = null
	districts.every(item => {
		if (item.district_id === districtId) {
			district = item
			return false
		}
		return true
	});
	if (!district) throw new CustomError.NotFoundError(`Can not find district or This district does not belong to ${province.name}`)

	const wards = await ghnAPI.addressAPI.getWards(districtId)
	if (wards.message) throw new CustomError.InternalServerError('Can not find wards')
	let ward = null
	wards.every(item => {
		if (item.code === wardCode) {
			ward = item
			return false
		}
		return true
	});
	if (!ward) throw new CustomError.NotFoundError(`Can not find ward or This ward does not belong to ${district.name}`)

	return { province, district, ward }
}

const getProvinces = async (req, res) => {
	const provinces = await ghnAPI.addressAPI.getProvinces()
	if (!Array.isArray(provinces)) {
		throw new CustomError.NotFoundError('Can not find provinces')
	} else {
		res.status(StatusCodes.OK).json(provinces)
	}
}
const getDistricts = async (req, res) => {
	const provinceId = req.params.province_id
	const districts = await ghnAPI.addressAPI.getDistricts(provinceId)
	console.log('districts:', districts)
	if (!Array.isArray(districts)) {
		throw new CustomError.NotFoundError('Can not find districts')
	} else {
		res.status(StatusCodes.OK).json(districts)
	}
}
const getWards = async (req, res) => {
	const districtId = req.params.district_id
	const wards = await ghnAPI.addressAPI.getWards(districtId)
	if (!Array.isArray(wards)) {
		throw new CustomError.NotFoundError('Can not find wards')
	} else {
		res.status(StatusCodes.OK).json(wards)
	}
}

module.exports = {
	getAllAddresses,
	createAddress,
	editAddressItem,
	deleteAddressItem,
	getProvinces,
	getDistricts,
	getWards,
	getAndCheckAddress,
	getAddressItemObj
	// createCategory,
	// uploadImage,
	// updateCategory,
	// deleteCategory
}