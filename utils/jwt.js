const jwt = require('jsonwebtoken');

const createJWT = ({ payload, type }) => {
	const token = jwt.sign(
		payload,
		process.env.JWT_SECRET,
		{
			expiresIn:
				(type === 'access') ? process.env.JWT_ACCESS_TOKEN_EXPIRE_TIME
					: process.env.JWT_REFRESH_TOKEN_EXPIRE_TIME
		});
	const tokenContent = jwt.verify(token, process.env.JWT_SECRET)
	return { token, exp: tokenContent.exp };
};

const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = {
	createJWT,
	isTokenValid,
};
