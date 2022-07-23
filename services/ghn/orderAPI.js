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
const { shipping } = require('../../utils/constants');
const orderAPIAxios = require('./orderAPIAxios');
const CustomError = require('../../errors');
const ghn = new giaohangnhanh_1.default(process.env.GHN_API_KEY_TEST ? process.env.GHN_API_KEY_TEST : "", { test: true });
const createOrder = (shopId, order) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('shopId', shopId);
    console.log('order 2', order);
    const shippingOrder = yield orderAPIAxios.createOrder(shopId, order);
    if (!(shippingOrder.code == 200)) {
        throw new CustomError.BadRequestError(`Creating shipping order error: ${shippingOrder.message}`);
    }
    console.log('orderAPI', shippingOrder.data);
    return shippingOrder.data;
});
class Order {
    constructor(user, address, orderItems, billing, status, note, shippingDetails, employee) {
        this.user = user;
        this.address = address,
            this.orderItems = orderItems,
            this.billing = billing,
            this.status = status,
            this.note = note,
            this.shippingDetails = shippingDetails,
            this.employee = employee;
    }
}
class OrderUser {
    constructor(userId, name, phoneNumber) {
        this.userId = userId,
            this.name = name,
            this.phoneNumber = phoneNumber;
    }
}
class AddressItem {
    constructor(receiverName, receiverPhoneNumber, province, district, ward, detailedAddress, addressType) {
        this.receiverName = receiverName;
        this.receiverPhoneNumber = receiverPhoneNumber;
        this.province = province;
        this.district = district;
        this.ward = ward;
        this.detailedAddress = detailedAddress;
        this.addressType = addressType;
    }
}
class Province {
    constructor(provinceId, name, code) {
        this.provinceId = provinceId;
        this.name = name;
        this.code = code;
    }
}
class District {
    constructor(districtId, provinceId, name, code) {
        this.districtId = districtId;
        this.provinceId = provinceId;
        this.name = name;
        this.code = code;
    }
}
class Ward {
    constructor(districtId, name, code) {
        this.districtId = districtId;
        this.name = name;
        this.code = code;
    }
}
class OrderItem {
    constructor(productId, sku, name, price, imageUrl, quantity, weight) {
        this.productId = productId;
        this.sku = sku;
        this.name = name;
        this.price = price;
        this.imageUrl = imageUrl;
        this.quantity = quantity;
        this.weight = weight;
    }
}
class Billing {
    constructor(subTotal, shippingFee, estimatedShippingFee, paymentMethod) {
        this.subTotal = subTotal;
        this.shippingFee = shippingFee;
        this.estimatedShippingFee = estimatedShippingFee;
        this.paymentMethod = paymentMethod;
    }
}
class ShippingDetails {
    constructor(weight, shippingProvider, shippingServiceId, shippingServiceTypeId, shippingOrderCode, transType, mainServiceFee, insurance, totalFee, expectedDeliveryTime) {
        this.weight = weight;
        this.shippingProvider = shippingProvider;
        this.shippingServiceId = shippingServiceId;
        this.shippingServiceTypeId = shippingServiceTypeId;
        this.shippingOrderCode = shippingOrderCode;
        this.transType = transType;
        this.mainServiceFee = mainServiceFee;
        this.insurance = insurance;
        this.totalFee = totalFee;
        this.expectedDeliveryTime = expectedDeliveryTime;
    }
}
/**
 * order options
 * to_name: string;
    to_phone: string;
    to_address: string;
    to_ward_code: string;
    to_district_id: number;
    return_phone?: string;
    return_address?: string;
    return_district_id?: number;
    return_ward_code?: string;
    service_id: number;
    service_type_id: number;
    content: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    payment_type_id: number | 1 | 2;
    required_note: string | 'CHOTHUHANG' | 'CHOXEMHANGKHONGTHU' | 'KHONGCHOXEMHANG';
    client_order_code?: string;
    cod_amount?: number;
    pick_station_id?: number;
    insurance_value?: number;
    coupon?: string;
    note?: string;
    items?: Array<IOrderItem>;
    deliver_station_id?: number;
 */
module.exports = {
    createOrder
};
