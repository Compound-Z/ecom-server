const createTokenUser = (user, shop) => {
	let tokenUser = { name: user.name, userId: user._id, role: user.role }
	if (user.role === 'seller') {
		tokenUser.shopId = shop._id
	}
	return tokenUser
};

module.exports = createTokenUser;
