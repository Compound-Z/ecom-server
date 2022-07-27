brands = ['none', 'vinamilk', 'universal', 'TH', 'Xmen', 'Nestlé']
categories = [
	//food
	'Snacks', 'Confectioneries',
	//
	'Frozen Foods',
	//drink
	'Soft Drink', 'Alcohol Baverages',
	//cooking, food
	'Canned Foods', 'Spice &s home cooking', 'Grains',
	//milk
	'Milk and Milk Products',
	//
	'Bathroom Toiletriess and Cleaners',
	//
	'Others'
]
shipping = {
	PACKAGE_WIDTH_DEFAULT: 20,
	PACKAGE_LENGTH_DEFAULT: 30,
	PACKAGE_HEIGHT_DEFAULT: 15,
}
processableStatus = ['PENDING']
cancelableStatus = ['PENDING', 'PROCESSING']
confirmableStatus = ['PROCESSING']
receivableStatus = ['CONFIRMED']
imgMaxSize = 4 * 1024 * 1024;
oneDayInMiliceconds = 24 * 3600 * 1000
fcmTTL = 60 * 60 * 24 * 3 //3 days
module.exports = {
	brands, categories, shipping, cancelableStatus, processableStatus, confirmableStatus, receivableStatus,
	imgMaxSize, oneDayInMiliceconds,
	fcmTTL
}