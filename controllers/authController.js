const User = require('../models/User');
const Token = require('../models/Token');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { body, validationResult } = require('express-validator');

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
		//for now, there is only password validator, so i return this message, if there r more validator, need to return msgs base on the errors
		throw new CustomError.BadRequestError("Please provide a stronger password: minimum eight characters, at least one uppercase letter, one lowercase letter and one number!")
	}

	const { phoneNumber, name, password } = req.body;

	const existedUser = await User.findOne({ phoneNumber });
	if (existedUser && existedUser.isVerified) {
		throw new CustomError.BadRequestError('Phone number already exists');
	}

	// first registered user is an admin
	const isFirstAccount = (await User.countDocuments({})) === 0;
	const role = isFirstAccount ? 'admin' : 'customer';

	//if user existed but has not verified yet, update new name, password
	if (existedUser && !existedUser.isVerified) {
		existedUser.name = name
		existedUser.password = password
		await existedUser.save()
	}

	const user = existedUser ? existedUser : await User.create({
		name,
		phoneNumber,
		password,
		role
	});

	//todo: enable this to send otp
	let verification = null
	try {
		verification = await sendVerificationOTP(user.phoneNumber);
	} catch (error) {
		console.log('error sendVerificationOTP:', error)
		throw new CustomError.ThirdPartyServiceError('Can not send OTP code')
	}

	res.status(StatusCodes.CREATED).json({
		message: 'Send OTP successfully',
	});
};

const verifyOTP = async (req, res) => {
	//for testing only.
	//todo: comment out in production enviroment
	//if check successfully
	// return res.status(StatusCodes.OK).json({ message: `Verify OTP successfully`, status: "approved" });


	const { otp, phoneNumber } = req.body;
	console.log('body', req.body)
	const user = await User.findOne({ phoneNumber });

	if (!user) {
		throw new CustomError.UnauthenticatedError('User does not exist');
	}

	let verificationCheck = null
	try {
		verificationCheck = await checkVerificationOTP(otp, phoneNumber);
	} catch (error) {
		console.log('error checkVerificationOTP:', error)
		throw new CustomError.ThirdPartyServiceError('Verify OTP failed')
	}
	console.log(verificationCheck)

	if (!(verificationCheck.status === 'approved')) {
		//error!
		res.status(StatusCodes.OK).json({ message: `Verify OTP failed`, status: "pending" })
		return
	}

	//if check successfully
	(user.isVerified = true), (user.verified = Date.now());

	//todo: uncomment
	await user.save();

	res.status(StatusCodes.OK).json({ message: `Verify OTP successfully`, status: "approved" });
};

const login = async (req, res) => {
	const { phoneNumber, password } = req.body;

	if (!phoneNumber || !password) {
		throw new CustomError.BadRequestError('Please provide phone number and password');
	}
	const user = await User.findOne({ phoneNumber });

	if (!user) {
		throw new CustomError.UnauthenticatedError('Invalid Credentials');
	}
	const isPasswordCorrect = await user.comparePassword(password);

	if (!isPasswordCorrect) {
		throw new CustomError.UnauthenticatedError('Invalid Credentials');
	}
	if (!user.isVerified) {
		throw new CustomError.UnauthenticatedError('Please verify your phoneNumber');
	}
	const tokenUser = createTokenUser(user);

	// create refresh token
	let refreshToken = '';
	// check for existing token
	const existingToken = await Token.findOne({ user: user._id });

	if (existingToken) {
		const { isValid } = existingToken;
		if (!isValid) {
			throw new CustomError.UnauthenticatedError('Invalid Credentials');
		}
		refreshToken = existingToken.refreshToken;
		const accessTokenJWT = createJWT({ payload: { user: tokenUser }, type: 'access' })
		const refreshTokenJWT = createJWT({ payload: { user: tokenUser, refreshToken }, type: 'refresh' })
		res.status(StatusCodes.OK).json({ user: tokenUser, accessToken: accessTokenJWT, refreshToken: refreshTokenJWT });
		return;
	}

	refreshToken = crypto.randomBytes(40).toString('hex');
	const userAgent = req.headers['user-agent'];
	const ip = req.ip;
	const userRefreshToken = { refreshToken, ip, userAgent, user: user._id };

	await Token.create(userRefreshToken);

	const accessTokenJWT = createJWT({ payload: { user: tokenUser }, type: 'access' })
	const refreshTokenJWT = createJWT({ payload: { user: tokenUser, refreshToken }, type: 'refresh' })
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
	await Token.findOneAndDelete({ user: req.user.userId });
	res.status(StatusCodes.OK).json({ message: 'Logged out successfully' });
};

const forgotPassword = async (req, res) => {
	const { phoneNumber } = req.body;
	if (!phoneNumber) {
		throw new CustomError.BadRequestError('Please provide valid phone number');
	}

	const user = await User.findOne({ phoneNumber });
	if (!user) {
		throw new CustomError.NotFoundError('User doesn\'t exist, please check your phone number')
	}

	if (user) {
		// send otp
		await sendVerificationOTP(user.phoneNumber);
	}

	res.status(StatusCodes.OK).json({ message: 'Please check your phonephoneNumber for reset OTP' });
};
const resetPassword = async (req, res) => {
	const { otp, phoneNumber, password } = req.body;
	if (!otp || !phoneNumber || !password) {
		throw new CustomError.BadRequestError('Please provide all values');
	}
	const user = await User.findOne({ phoneNumber });
	if (!user) {
		throw new CustomError.NotFoundError('User doesn\'t exist, please check your phone number')
	}
	if (user) {

		const verificationCheck = await checkVerificationOTP(otp, phoneNumber)

		if (verificationCheck.status === 'approved') {
			user.password = password;
			await user.save();
		} else {
			throw new CustomError.UnauthenticatedError('Can not verify OTP')
		}
	}

	res.status(StatusCodes.OK).json({ message: "Reset password successfully" });
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
			throw new CustomError.UnauthenticatedError('Invalid refresh token');
		}

		const userToken = payload.user
		const accessTokenJWT = createJWT({ payload: { userToken }, type: 'access' })

		req.user = payload.user;
		res.status(StatusCodes.OK).json({ accessToken: accessTokenJWT })
	} catch (error) {
		console.log('error: ', error)
		throw new CustomError.UnauthenticatedError('Invalid refresh token')
	}
}
module.exports = {
	register,
	login,
	logout,
	verifyOTP,
	forgotPassword,
	resetPassword,
	refreshToken,
};
