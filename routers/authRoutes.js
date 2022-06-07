const express = require('express');
const router = express.Router();

const { authenticateUser } = require('../middleware/authentication');
const passwordValidator = require('../middleware/validator')
const {
	register,
	login,
	logout,
	verifyOTP,
	forgotPassword,
	resetPassword,
	refreshToken,
} = require('../controllers/authController');

router.post('/signup', passwordValidator, register);
router.post('/login', login);
router.delete('/logout', authenticateUser, logout);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', passwordValidator, resetPassword);
router.post('/forgot-password', forgotPassword);
router.post('/refresh-token', refreshToken)

module.exports = router;
