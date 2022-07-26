const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./custom-api');

class BadRequestError extends CustomAPIError {
	constructor(message) {
		super(message);
		this.statusCode = StatusCodes.BAD_REQUEST;
	}
}
class BadRequestError2 extends CustomAPIError {
	constructor(message, originErrorObj) {
		super(message);
		this.statusCode = StatusCodes.BAD_REQUEST;
		this.originErrorObj = originErrorObj
	}
}

module.exports = { BadRequestError, BadRequestError2 };
