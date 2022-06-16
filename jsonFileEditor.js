// const fs = require('fs');
// const start = () => {
// 	let rawdata = fs.readFileSync('./static_data/province_ghn.json');
// 	let provinces = JSON.parse(rawdata)

// 	let edittedProvinces = []
// 	provinces.data.forEach(province => {
// 		const edittedProvince = {
// 			id: province.ProvinceID,
// 			name: province.ProvinceName,
// 			code: province.Code,
// 			regionId: province.RegionID
// 		}
// 		edittedProvinces.push(edittedProvince)
// 	});
// 	let stringEdittedProvinces = JSON.stringify({ edittedProvinces })
// 	fs.writeFileSync('province_ghn_editted.json', stringEdittedProvinces)
// }
// start()