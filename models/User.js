const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Please provide name'],
		minlength: 2,
		maxlength: 50,
	},
	phoneNumber: {
		type: String,
		unique: true,
		required: [true, 'Please provide phone number'],
		validate: {
			validator: validator.isMobilePhone,
			message: 'Please provide valid mobile phone number',
		},
	},
	profilePictureUrl: {
		type: String,
		minlength: 3,
		maxlength: 250,
	},
	password: {
		type: String,
		required: [true, 'Please provide password'],
		minlength: 6,
	},
	role: {
		type: String,
		enum: ['admin', 'customer'],
		default: 'customer',
	},
	isVerified: {
		type: Boolean,
		default: false,
	},
	verified: Date,
	cartId: {
		type: mongoose.Schema.ObjectId,
		ref: 'Cart',
		required: true,
	},
}, { timestamps: true });

UserSchema.pre('save', async function () {
	if (!this.isModified('password') && !this.isModified('name')) return;
	if (this.isModified('password')) {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
	}
});

UserSchema.methods.comparePassword = async function (canditatePassword) {
	const isMatch = await bcrypt.compare(canditatePassword, this.password);
	return isMatch;
};

module.exports = mongoose.model('User', UserSchema);
