const express = require('express');
const router = express.Router();

// const { authenticateUser } = require('../middleware/authentication');

const {
	register,
	login,
	logout,
	verifyOTP,
	forgotPassword,
	resetPassword,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.delete('/logout'/*, authenticateUser*/, logout);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/forgot-password', forgotPassword);

module.exports = router;
