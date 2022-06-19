const CustomError = require('../errors');
const { isTokenValid } = require('../utils');
const Token = require('../models/Token');

const authenticateUser = async (req, res, next) => {
	const authHeader = req.headers.authorization;
	console.log('body:', req.body)
	if (!authHeader || !authHeader.startsWith('Bearer')) {
		throw new CustomError.UnauthenticatedError('Header or token is missing')
	}
	const accessToken = authHeader.split(' ')[1]

	try {
		const payload = isTokenValid(accessToken);
		req.user = payload.user;
		return next();
	} catch (error) {
		console.log('error: ', error)
		throw new CustomError.UnauthenticatedError('Invalid access token');
	}
};

const authorizePermissions = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			throw new CustomError.UnauthorizedError(
				'Unauthorized to access this route'
			);
		}
		next();
	};
};

module.exports = {
	authenticateUser,
	authorizePermissions,
};
