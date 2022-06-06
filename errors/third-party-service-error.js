const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./custom-api');

class ThirdPartyServiceError extends CustomAPIError {
	constructor(message) {
		super(message);
		this.statusCode = StatusCodes.SERVICE_UNAVAILABLE;
	}
}

module.exports = ThirdPartyServiceError;