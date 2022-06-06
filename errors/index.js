const CustomAPIError = require('./custom-api');
const UnauthenticatedError = require('./unauthenticated');
const NotFoundError = require('./not-found');
const BadRequestError = require('./bad-request');
const UnauthorizedError = require('./unauthorized');
const ThirdPartyServiceError = require('./third-party-service-error');

module.exports = {
	CustomAPIError,
	UnauthenticatedError,
	NotFoundError,
	BadRequestError,
	UnauthorizedError,
	ThirdPartyServiceError,
};
