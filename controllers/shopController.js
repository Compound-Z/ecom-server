const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const uploadFile = require('../utils/fileUploadHelper');
const { addUnderline } = require('../utils/stringHelper')
const Shop = require('../models/Shop')


const createShop = async (shopInfo) => {
	const { name, imageUrl, address } = shopInfo

	if (!name || !imageUrl || !address) throw new CustomError.BadRequestError('Please provide required information')

	const shop = await Shop.createShop(name, imageUrl, address)
	if (!shop) throw new CustomError.InternalServerError('Can not create new shop')

	return shop._id
}

const createShippingShop = async (shippingShopInfo) => {
	const { districtId, wardCode, name, phone, address } = shippingShopInfo

	//call ghn api
}