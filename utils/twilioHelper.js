const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const sendVerificationOTP = async (phone) => {
	return client.verify.services('VA6fe5ca91df06145ffd1de4dd56756407')
		.verifications
		.create({ to: phone, channel: 'sms' })
}

const checkVerificationOTP = async (otp, phone) => {
	return client.verify.services('VA6fe5ca91df06145ffd1de4dd56756407')
		.verificationChecks
		.create({ to: phone, code: otp })
}
module.exports = { sendVerificationOTP, checkVerificationOTP }