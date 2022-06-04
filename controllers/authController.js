const User = require('../models/User');
const Token = require('../models/Token');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
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
	const { phoneNumber, name, password } = req.body;

	const phoneNumberAlreadyExists = await User.findOne({ phoneNumber });
	if (phoneNumberAlreadyExists) {
		throw new CustomError.BadRequestError('Phone number already exists');
	}

	// first registered user is an admin
	const isFirstAccount = (await User.countDocuments({})) === 0;
	const role = isFirstAccount ? 'admin' : 'customer';


	const user = await User.create({
		name,
		phoneNumber,
		password,
		role
	});

	const verification = await sendVerificationOTP(user.phoneNumber);

	res.status(StatusCodes.CREATED).json({
		message: 'Send OTP successfully',
	});
};

const verifyOTP = async (req, res) => {
	const { otp, phoneNumber } = req.body;
	const user = await User.findOne({ phoneNumber });

	//todo: this should be uncommented later
	if (!user) {
		throw new CustomError.UnauthenticatedError('User does not exist');
	}

	const verificationCheck = await checkVerificationOTP(otp, phoneNumber);
	console.log(verificationCheck)
	if (!(verificationCheck.status === 'approved')) {
		//error!
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: `Verify OTP failed.` })
		return
	}

	//if check successfully
	(user.isVerified = true), (user.verified = Date.now());

	//todo: uncomment
	await user.save();

	res.status(StatusCodes.OK).json({ message: `Verify phone number successfully` });
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
	res.status(StatusCodes.OK).json({ user: tokenUser, accessToken: accessTokenJWT, refreshToken: refreshTokenJWT });
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
