// const fs = require('fs');
// const read = (absolutePath) => {
// 	let rawdata = fs.readFileSync(absolutePath);
// 	let provinces = JSON.parse(rawdata)

// 	let edittedProvinces = []
// 	provinces.data.forEach(province => {
// 		const edittedProvince = {
// 			ProvinceID: province.ProvinceID,
// 			ProvinceName: province.ProvinceName,
// 			Code: province.Code,
// 			RegionID: province.RegionID
// 		}
// 		edittedProvinces.push(edittedProvince)
// 	});
// 	return edittedProvinces
// }

// module.exports = read