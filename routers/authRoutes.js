const express = require('express');
const router = express.Router();

const { authenticateUser } = require('../middleware/authentication');

const {
	register,
	login,
	logout,
	verifyOTP,
	forgotPassword,
	resetPassword,
	refreshToken,
} = require('../controllers/authController');

router.post('/signup', register);
router.post('/login', login);
router.delete('/logout', authenticateUser, logout);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/forgot-password', forgotPassword);
router.post('/refresh', refreshToken)

module.exports = router;
