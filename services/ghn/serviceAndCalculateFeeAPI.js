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
const ghn = new giaohangnhanh_1.default(process.env.GHN_API_KET_TEST ? process.env.GHN_API_KET_TEST : "", { test: true });
const calculateFee = (fromDistrictId, toDistrictId, toWardCode, weight, length, width, height, insuranceValue) => __awaiter(void 0, void 0, void 0, function* () {
    const shopId = parseInt(process.env.SHOP_ID + '');
    const services = yield ghn.service.getServices(shopId, fromDistrictId, toDistrictId);
    const feeOptions = [];
    services.array.forEach((service) => __awaiter(void 0, void 0, void 0, function* () {
        const fee = yield ghn.service.calculateFee(shopId, {
            service_id: service.service_id,
            insurance_value: insuranceValue,
            to_district_id: toDistrictId,
            to_ward_code: toWardCode,
            weight: weight,
            length: length,
            width: width,
            height: height
        });
        feeOptions.push({ service_id: service.service_id, name: service.name, fee });
    }));
    return feeOptions;
});
const calculateExpectedDeliveryTime = (provinceId) => __awaiter(void 0, void 0, void 0, function* () {
    return ghn.address.getDistricts(provinceId);
});
module.exports = {
    calculateFee,
    calculateExpectedDeliveryTime,
};
