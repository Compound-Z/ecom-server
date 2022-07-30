const mongoose = require('mongoose');
const { resolve } = require('fs');
const path = require('path')
const read = require('../utils/fileReadHelper')
const CountrySchema = require('../models/Country')
const Category = require('../models/Category');
const { categories } = require('../utils/constants');
var _ = require('underscore')
const { addUnderline, removeUnderline } = require('../utils/stringHelper')

const bootstrap = async () => {
	let shouldUpload = false
	mongoose.connection.db.listCollections({ name: "countries" }).toArray(
		async function (err, names) {
			if (!names || names.length === 0) {
				shouldUpload = true
				if (shouldUpload) {
					await uploadDataToDB(Country, './static_data/countries.json')
					console.log('Upload countries db done')
				}
			}
		}
	)
}

const bootstrapCategories = async () => {
	/***if the category table is empty, boostrap data */
	const firstCate = await Category.findOne({})
	if (!firstCate) {
		await uploadDataToDBCategory('./static_data/categories.json')
		console.log('Upload categories to db done')
	}
}

const uploadDataToDB = async (Country, relativePath) => {
	console.log('Uploading data to db...')
	const absolutePath = path.resolve(relativePath)
	const countries = read(absolutePath)
	const createdCountries = await Country.create(countries)
}

const uploadDataToDBCategory = async (relativePath) => {
	console.log('Uploading data to db...')
	const absolutePath = path.resolve(relativePath)
	const categories = read(absolutePath)
	const categoriesUnderscore = _.map(categories, function (category) {
		return {
			name: addUnderline(category.name),
			imageUrl: category.imageUrl
		}
	})
	const createdCategories = await Category.create(categoriesUnderscore)
}

module.exports = { bootstrap, bootstrapCategories }