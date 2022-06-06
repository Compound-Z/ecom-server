const { body } = require('express-validator');
const passwordValidator = body('password').isStrongPassword({
	minLength: 8,
	minLowercase: 1,
	minUppercase: 1,
	minNumbers: 1,
})

module.exports = passwordValidator