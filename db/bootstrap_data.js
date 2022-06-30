const mongoose = require('mongoose');
const { resolve } = require('fs');
const path = require('path')
const read = require('../utils/fileReadHelper')
const CountrySchema = require('../models/Country')

const bootstrap = async () => {
	let shouldUpload = false
	mongoose.connection.db.listCollections({ name: "countries" }).toArray(
		async function (err, names) {
			if (!names || names.length === 0) {
				shouldUpload = true
				if (shouldUpload) {
					const Country = mongoose.model('Country', CountrySchema)
					await uploadDataToDB(Country, './static_data/countries.json')
					console.log('Upload db done')
				}
			}
		}
	)
}

const uploadDataToDB = async (Country, relativePath) => {
	console.log('Uploading data to db...')
	const absolutePath = path.resolve(relativePath)
	const countries = read(absolutePath)
	const createdCountries = await Country.create(countries)
}

module.exports = { bootstrap }