const User = require('../models/User');
const Cart = require('../models/Cart')
const Token = require('../models/Token');
const { Address } = require('../models/Address')
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { body, validationResult } = require('express-validator');
const errorMsgs = require('../errors/error_msgs')
const Shop = require('../models/Shop')
const { addUnderline, removeUnderline } = require('../utils/stringHelper')
const ghnAPI = require('../services/ghn/ghnAPI');
const { getAddressItemObj, getAndCheckAddress } = require('./addressController')
const {
	createJWT,
	isTokenValid,
	createTokenUser,
	sendVerificationOTP,
	checkVerificationOTP,
	createHash,
} = require('../utils');
const crypto = require('crypto');

const register = async (req, res) => {
	//for testing only.
	//todo: comment out in production enviroment
	// return res.status(StatusCodes.CREATED).json({
	// 	message: 'Send OTP successfully',
	// });

	/**Validate body */
	const errrorsValidate = validationResult(req)
	if (!errrorsValidate.isEmpty()) {
		console.log(errrorsValidate)
		//for now, there is only password validator, so i return this message, if there r more validator, need to return msgs base on the errors
		throw new CustomError.BadRequestError("Please provide a stronger password: minimum eight characters, at least one uppercase letter, one lowercase letter and one number!")
	}

	const { phoneNumber, name, password, role, shopName, shopDescription, imageUrl, provinceId, districtId, wardCode, detailedAddress } = req.body;
	if (!phoneNumber || !name || !password || !role) throw new CustomError.BadRequestError('Please provide required info')
	if (role === 'seller') {
		if (!shopName || !shopDescription || !imageUrl || !provinceId || !districtId || !wardCode || !detailedAddress) throw new CustomError.BadRequestError('Please provide required info')
		shopNameUnderLine = addUnderline(shopName)
	}

	const existedUser = await User.findOne({ phoneNumber });
	if (existedUser && existedUser.isVerified) {
		throw new CustomError.BadRequestError(errorMsgs.PHONE_NUMBER_ALREADY_EXIST);
	}

	// first registered user is an admin
	// const isFirstAccount = (await User.countDocuments({})) === 0;
	// const role = isFirstAccount ? 'admin' : 'customer';

	//if user existed but has not verified yet, update new name, password
	if (existedUser && !existedUser.isVerified) {
		existedUser.name = name
		existedUser.password = password
		await existedUser.save()
	}

	//if user have not existed yet, create an Shop object and associate it with User

	let user = null;
	if (!existedUser) {
		user = await User.create({
			name,
			phoneNumber,
			password,
			role,
		});
		/**after creating a brand new user, create a new cart and associate it with the just-created user */
		if (user.role === 'seller') {
			const { province, district, ward } = await getAndCheckAddress(provinceId, districtId, wardCode)
			const addressItem = getAddressItemObj(provinceId, province, districtId, district, wardCode, ward, detailedAddress, user.name, user.phoneNumber)
			const shop = await Shop.create({ userId: user._id, name: shopNameUnderLine, description: shopDescription, addressItem, imageUrl })
		}
		else if (user.role === 'customer') {
			const cart = await Cart.create({ userId: user._id })
			const address = await Address.create({ userId: user._id })
		}

	} else {
		user = existedUser
	}

	if (!user) throw new CustomError.InternalServerError('Internal system error!')

	let verification = null
	try {
		verification = await sendVerificationOTP(user.phoneNumber);
	} catch (error) {
		console.log('error sendVerificationOTP:', error)
		throw new CustomError.ThirdPartyServiceError(errorMsgs.CAN_NOT_SEND_OTP)
	}

	res.status(StatusCodes.CREATED).json({
		message: 'Send OTP successfully',
	});
};

const verifyOTP = async (req, res) => {
	//for testing only.
	//todo: comment out in production enviroment
	//if check successfully
	// return res.status(StatusCodes.OK).json({ message: `Verify OTP successfully`, status: errorMsgs.APPROVED });


	const { otp, phoneNumber } = req.body;
	console.log('body', req.body)
	const user = await User.findOne({ phoneNumber });
	console.log('user', user)
	if (!user) {
		throw new CustomError.UnauthenticatedError(errorMsgs.USER_DOES_NOT_EXIST);
	}

	let verificationCheck = null
	try {
		verificationCheck = await checkVerificationOTP(otp, phoneNumber);
	} catch (error) {
		console.log('error checkVerificationOTP:', error)
		throw new CustomError.ThirdPartyServiceError(errorMsgs.VERIFY_OTP_FAILED)
	}
	console.log(verificationCheck)

	if (!(verificationCheck.status === errorMsgs.APPROVED)) {
		//error!
		res.status(StatusCodes.OK).json({ message: errorMsgs.VERIFY_OTP_FAILED, status: errorMsgs.PENDING })
		return
	}
	console.log('role seller', user.role === 'seller')
	if (user.role === 'seller') {
		const shop = await Shop.findOneAndUpdate({ userId: user._id }, {})
		//create new shippingShop on ghn system if there is not shippingShop belongs to this shop
		if (!shop.shippingShopId) {
			const addressItem = shop.addressItem
			const shippingShop = await ghnAPI.storeAPI.createStore(
				addressItem.district.districtId,
				addressItem.ward.code,
				{
					name: removeUnderline(shop.name),
					phone: phoneNumber,
					address: addressItem.detailedAddress,
				}
			)
			if (shippingShop.message) {
				//if error
				throw new CustomError.InternalServerError(`Giaohangnhanh: ${shippingShop.message}`)
			}
			//update shipping shop id to shop 
			shop.shippingShopId = shippingShop.shop_id;
			console.log('shop', shop);
			await shop.save();
		}
	}


	//if check successfully
	(user.isVerified = true), (user.verified = Date.now());
	//todo: uncomment
	await user.save();
	res.status(StatusCodes.OK).json({ message: errorMsgs.VERIFY_OTP_SUCCESSFULLY, status: errorMsgs.APPROVED });
};

const login = async (req, res) => {
	const { phoneNumber, password } = req.body;

	if (!phoneNumber || !password) {
		throw new CustomError.BadRequestError('Please provide phone number and password');
	}
	const user = await User.findOne({ phoneNumber });

	if (!user) {
		throw new CustomError.UnauthenticatedError(errorMsgs.INVALID_CREDENTIALS);
	}
	const isPasswordCorrect = await user.comparePassword(password);

	if (!isPasswordCorrect) {
		throw new CustomError.UnauthenticatedError(errorMsgs.INVALID_CREDENTIALS);
	}
	if (!user.isVerified) {
		throw new CustomError.UnauthenticatedError(errorMsgs.VERIFY_PHONE);
	}

	let shop = null
	if (user.role === 'seller') {
		shop = await Shop.findOne({ userId: user._id })
		if (!shop) {
			throw new CustomError.NotFoundError('Can not find user shop');
		}
	}

	const tokenUser = createTokenUser(user, shop);

	// create refresh token
	let refreshToken = '';
	// check for existing token
	const existingToken = await Token.findOne({ user: user._id });

	if (existingToken) {
		const { isValid } = existingToken;
		if (!isValid) {
			throw new CustomError.UnauthenticatedError(errorMsgs.INVALID_CREDENTIALS);
		}
		refreshToken = existingToken.refreshToken;
		const accessTokenJWT = createJWT({ payload: { user: tokenUser }, type: errorMsgs.TOKEN_TYPE_ACCESS })
		const refreshTokenJWT = createJWT({ payload: { user: tokenUser, refreshToken }, type: errorMsgs.TOKEN_TYPE_REFRESH })
		res.status(StatusCodes.OK).json(
			{
				user: tokenUser,
				tokens: {
					accessToken: accessTokenJWT,
					refreshToken: refreshTokenJWT
				}
			}
		);
		return;
	}

	refreshToken = crypto.randomBytes(40).toString('hex');
	const userAgent = req.headers['user-agent'];
	const ip = req.ip;
	const userRefreshToken = { refreshToken, ip, userAgent, user: user._id };

	await Token.create(userRefreshToken);

	const accessTokenJWT = createJWT({ payload: { user: tokenUser }, type: errorMsgs.TOKEN_TYPE_ACCESS })
	const refreshTokenJWT = createJWT({ payload: { user: tokenUser, refreshToken }, type: errorMsgs.TOKEN_TYPE_REFRESH })
	res.status(StatusCodes.OK).json(
		{
			user: tokenUser,
			tokens: {
				accessToken: accessTokenJWT,
				refreshToken: refreshTokenJWT
			}
		}
	);
};
const logout = async (req, res) => {
	try {
		await Token.findOneAndDelete({ user: req.user.userId });
	} catch (error) {
		console.log('error: logout: ', error)
		throw new CustomError.NotFoundError('Can not found this token!')
	}
	res.status(StatusCodes.OK).json({ message: 'Logged out successfully!' });
};

const forgotPassword = async (req, res) => {
	console.log('body:', req.body)
	const { phoneNumber } = req.body;
	if (!phoneNumber) {
		throw new CustomError.BadRequestError('Please provide valid phone number');
	}

	const user = await User.findOne({ phoneNumber });
	if (!user) {
		throw new CustomError.NotFoundError(errorMsgs.USER_DOES_NOT_EXIST)
	}

	try {
		await sendVerificationOTP(user.phoneNumber);
	} catch (error) {
		throw new CustomError.ThirdPartyServiceError(errorMsgs.CAN_NOT_SEND_OTP)
	}

	res.status(StatusCodes.OK).json({ message: 'Please check your phone for reset OTP' });
};
const resetPassword = async (req, res) => {
	/**Validate body */
	const errrorsValidate = validationResult(req)
	if (!errrorsValidate.isEmpty()) {
		//for now, there is only password validator, so i return this message, if there r more validator, need to return msgs base on the errors
		throw new CustomError.BadRequestError("Please provide a stronger password: minimum eight characters, at least one uppercase letter, one lowercase letter and one number!")
	}
	console.log('body:', req.body)
	const { otp, phoneNumber, password } = req.body;
	if (!otp || !phoneNumber || !password) {
		throw new CustomError.BadRequestError(errorMsgs.PROVIDE_ALL_VALUE);
	}
	const user = await User.findOne({ phoneNumber });
	if (!user) {
		throw new CustomError.NotFoundError(errorMsgs.USER_DOES_NOT_EXIST)
	}

	let verificationCheck = null
	try {
		verificationCheck = await checkVerificationOTP(otp, phoneNumber)
	} catch (error) {
		console.log('error:', error)
		throw new CustomError.ThirdPartyServiceError(errorMsgs.VERIFY_OTP_FAILED)
	}

	if (verificationCheck.status === errorMsgs.APPROVED) {
		user.password = password;
		await user.save();
		return res.status(StatusCodes.OK).json({ message: errorMsgs.APPROVED });
	} else {
		return res.status(StatusCodes.OK).json({ message: errorMsgs.PENDING });
	}
};

const refreshToken = async (req, res) => {
	const refreshToken = req.body.refreshToken;
	console.log('body: ', req.body)

	if (!refreshToken) {
		throw new CustomError.UnauthenticatedError('refresh_token is missing')
	}
	try {
		const payload = isTokenValid(refreshToken);
		console.log('payload:', payload)
		const existingToken = await Token.findOne({
			user: payload.user.userId,
			refreshToken: payload.refreshToken,
		});
		console.log('existingToken: ', existingToken)

		if (!existingToken || !existingToken?.isValid) {
			throw new CustomError.UnauthenticatedError(errorMsgs.INVALID_REFRESH_TOKEN);
		}

		const userToken = payload.user
		const accessTokenJWT = createJWT({ payload: { user: userToken }, type: errorMsgs.TOKEN_TYPE_ACCESS })

		req.user = payload.user;
		res.status(StatusCodes.OK).json({ accessToken: accessTokenJWT })
	} catch (error) {
		console.log('error: ', error)
		throw new CustomError.UnauthenticatedError(errorMsgs.INVALID_REFRESH_TOKEN)
	}
}
const updateFCMToken = async (req, res) => {
	const fcmToken = req.body.fcmToken
	const userId = req.user.userId
	if (!fcmToken) {
		throw new CustomError.BadRequestError("FCM token is missing!")
	}

	const user = await User.findOneAndUpdate({
		_id: userId
	}, {
		fcmToken: fcmToken
	}, { new: true, runValidators: true })

	if (!user) { throw new CustomError.NotFoundError('Not found user!') }
	console.log('user', user)
	res.status(StatusCodes.OK).json({ message: "update fcm token successfully!" })
}
module.exports = {
	register,
	login,
	logout,
	verifyOTP,
	forgotPassword,
	resetPassword,
	refreshToken,
	updateFCMToken
};
