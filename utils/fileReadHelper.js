const fs = require('fs');
const read = (absolutePath) => {
	let rawdata = fs.readFileSync(absolutePath);
	let items = JSON.parse(rawdata)
	return items
}

module.exports = read