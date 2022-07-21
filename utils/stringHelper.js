const addUnderline = (str) => {
	return str.trim().replace(/\s/g, '_')
}
const removeUnderline = (str) => {
	return str.trim().replace(/_/g, ' ')
}
module.exports = { addUnderline, removeUnderline }