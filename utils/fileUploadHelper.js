const cloudinary = require('cloudinary').v2
const fs = require('fs')
const { StatusCodes } = require('http-status-codes')

const uploadFile = async (req, res, folderPath) => {
	if (!req.files) {
		throw new CustomError.BadRequestError('No File Uploaded');
	}
	const categoryImage = req.files.image;
	if (!categoryImage.mimetype.startsWith('image')) {
		throw new CustomError.BadRequestError('Please Upload Image');
	}
	const maxSize = 1024 * 1024;
	if (categoryImage.size > maxSize) {
		throw new CustomError.BadRequestError('Please upload image smaller 1MB');
	}

	const result = await cloudinary.uploader.upload(
		req.files.image.tempFilePath,
		{
			use_filename: true,
			folder: folderPath
		}
	)
	fs.unlinkSync(req.files.image.tempFilePath)

	res.status(StatusCodes.CREATED).json({ image: { src: result.secure_url } })
}

module.exports = uploadFile