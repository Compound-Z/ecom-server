const CustomAPIError = require('./custom-api');
const UnauthenticatedError = require('./unauthenticated');
const NotFoundError = require('./not-found');
const { BadRequestError, BadRequestError2 } = require('./bad-request');
const UnauthorizedError = require('./unauthorized');
const ThirdPartyServiceError = require('./third-party-service-error');
const InternalServerError = require('./internal-server-error')
module.exports = {
	CustomAPIError,
	UnauthenticatedError,
	NotFoundError,
	BadRequestError,
	BadRequestError2,
	UnauthorizedError,
	ThirdPartyServiceError,
	InternalServerError,
};
