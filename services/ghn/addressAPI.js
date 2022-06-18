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
const getProvinces = () => __awaiter(void 0, void 0, void 0, function* () {
    return ghn.address.getProvinces();
});
const getDistricts = (provinceId) => __awaiter(void 0, void 0, void 0, function* () {
    return ghn.address.getDistricts(provinceId);
});
const getWards = (districtId) => __awaiter(void 0, void 0, void 0, function* () {
    return ghn.address.getWards(districtId);
});
module.exports = {
    getProvinces,
    getDistricts,
    getWards
};
