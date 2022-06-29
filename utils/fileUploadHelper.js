const cloudinary = require('cloudinary').v2
const fs = require('fs')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors');
const { imgMaxSize } = require('../utils/constants')

const uploadFile = async (req, res, folderPath) => {
	console.log('body:', req)
	if (!req.files) {
		throw new CustomError.BadRequestError('No File Uploaded');
	}
	const categoryImage = req.files.image;
	if (!categoryImage.mimetype.startsWith('image')) {
		throw new CustomError.BadRequestError('Please Upload Image');
	}
	if (categoryImage.size > imgMaxSize) {
		throw new CustomError.BadRequestError('Please upload image smaller 2MB');
	}

	const result = await cloudinary.uploader.upload(
		req.files.image.tempFilePath,
		{
			use_filename: true,
			folder: folderPath
		}
	)
	fs.unlinkSync(req.files.image.tempFilePath)

	res.status(StatusCodes.CREATED).json({ url: result.secure_url })
}

module.exports = uploadFile