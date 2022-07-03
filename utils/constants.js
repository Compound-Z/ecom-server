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
receivableStatus = ['CONFIRMED']
imgMaxSize = 2 * 1024 * 1024;
oneDayInMiliceconds = 24 * 3600 * 1000

module.exports = { brands, categories, shipping, cancelableStatus, processableStatus, receivableStatus, imgMaxSize, oneDayInMiliceconds }