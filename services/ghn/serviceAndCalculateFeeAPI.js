"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const giaohangnhanh_1 = __importDefault(require("giaohangnhanh"));
const ghn = new giaohangnhanh_1.default(process.env.GHN_API_KEY_TEST ? process.env.GHN_API_KEY_TEST : "", { test: true });
const serviceAndCalculateFeeAPIAxios = require('./serviceAndCalculateFeeAPIAxios');
const CustomError = require('../../errors');
const calculateFeeOptions = (shopId, fromDistrictId, toDistrictId, toWardCode, weight, length, width, height, insuranceValue) => __awaiter(void 0, void 0, void 0, function* () {
    const services = yield serviceAndCalculateFeeAPIAxios.getServices(shopId, fromDistrictId, toDistrictId);
    console.log('services:', services);
    const feeOptions = [];
    for (const service of services.data) {
        console.log(shopId, fromDistrictId, toDistrictId, toWardCode, weight, length, width, height, insuranceValue, service.service_id);
        const response = yield serviceAndCalculateFeeAPIAxios.calculateFee(service.service_id, fromDistrictId, toDistrictId, toWardCode, weight, length, width, height, insuranceValue);
        console.log('response', response);
        if (response.code == 200)
            feeOptions.push({ service_id: service.service_id, name: service.short_name, fee: response.data });
    }
    console.log('fee options', feeOptions);
    return feeOptions;
});
const calculateExpectedDeliveryTime = (provinceId) => __awaiter(void 0, void 0, void 0, function* () {
    return ghn.address.getDistricts(provinceId);
});
const calculateFee = (shippingServiceId, fromDistrictId, toDistrictId, toWardCode, weight, length, width, height, insuranceValue) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('cal fee', shippingServiceId, fromDistrictId, toDistrictId, toWardCode, weight, length, width, height, insuranceValue);
    const response = yield serviceAndCalculateFeeAPIAxios.calculateFee(shippingServiceId, fromDistrictId, toDistrictId, toWardCode, weight, length, width, height, insuranceValue);
    console.log('response', response);
    // const fee = await ghn.service.calculateFee(
    // 	{
    // 		service_id: shippingServiceId,
    // 		insurance_value: insuranceValue,
    // 		to_district_id: toDistrictId,
    // 		to_ward_code: toWardCode,
    // 		weight: weight,
    // 		length: length,
    // 		width: width,
    // 		height: height
    // 	}
    // )
    console.log('response:', response);
    if (!(response.code == 200)) {
        throw new CustomError.BadRequestError(`Shipping service error: ${response.message}`);
    }
    return response.data;
});
module.exports = {
    calculateFeeOptions,
    calculateFee,
    calculateExpectedDeliveryTime,
};
