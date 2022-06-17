const Address = require('../models/Address')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const ghnAPI = require('../services/ghn/ghnAPI');
const { findOneAndUpdate } = require('../models/Address');

const getAllAddresses = async (req, res) => {
	const addresses = await Address.find({
		userId
	})
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

	/**get address info from ghn api */
	const provinces = await ghnAPI.addressAPI.getProvinces()
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
	let ward = null
	wards.every(item => {
		if (item.code === wardCode) {
			ward = item
			return false
		}
		return true
	});
	if (!ward) throw new CustomError.NotFoundError(`Can not find ward or This ward does not belong to ${district.name}`)


	const addressItem = {
		id: provinceId.toString() + districtId.toString() + wardCode + '|' + detailedAddress + '|' + Date.now(),
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
	if (!address) {
		//create new address object on db with one address item
		address = await Address.create({
			userId,
			addresses: [addressItem],
			defaultAddressId: addressItem.id,
		})

		res.status(StatusCodes.CREATED).json(address)
	} else {
		//push new address item
		const defaultAddressId = (isDefaultAddress === true) ? addressItem.id : address.defaultAddressId
		address = await Address.findOneAndUpdate({
			userId
		}, {
			$push: {
				addresses: addressItem
			},
			$set: {
				defaultAddressId: defaultAddressId
			}
		}, { new: true, runValidators: true }
		)
		res.status(StatusCodes.OK).json(address)
	}
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

// const addAddress = async (req, res) => {
// 	//for now, user will be hardcoded: 
// 	console.log('body: ', req.body)
// 	req.body.user = 'test_user_id'

// 	const { name, imageUrl, numberOfProduct } = req.body

// 	const category = await Category.create({
// 		name, imageUrl, numberOfProduct
// 	})

// 	res.status(StatusCodes.CREATED).json(category)
// }

// //todo: change to multi file upload?
// const uploadImage = async (req, res) => {
// 	uploadFile(req, res, '10-ecom/category')
// }
// const updateCategory = async (req, res) => {
// 	const categoryId = req.params.id
// 	const { name, imageUrl, numberOfProduct } = req.body
// 	const category = await Category.findOneAndUpdate(
// 		{ _id: categoryId },
// 		{ name, imageUrl, numberOfProduct },
// 		{ new: true, runValidators: true })

// 	if (!category) {
// 		throw new CustomError.NotFoundError(`This category with id ${categoryId} does not exist`)
// 	}

// 	res.status(StatusCodes.OK).json(category)
// }
// const deleteCategory = async (req, res) => {
// 	const categoryId = req.params.id

// 	const category = await Category.findOne({ _id: categoryId })
// 	if (!category) {
// 		throw new CustomError.NotFoundError(`This category with id ${categoryId} does not exist`)
// 	}

// 	await category.remove()
// 	res.status(StatusCodes.OK).json({ msg: "remove category successfully" })
// }

module.exports = {
	getAllAddresses,
	createAddress,
	getProvinces,
	getDistricts,
	getWards
	// createCategory,
	// uploadImage,
	// updateCategory,
	// deleteCategory
}