import GHN from "giaohangnhanh";
const { shipping } = require('../../utils/constants')
const ghn: GHN = new GHN(process.env.GHN_API_KEY_TEST ? process.env.GHN_API_KEY_TEST : "", { test: true })
const createOrder = async (order: Order) => {
	const shopId = parseInt(process.env.SHOP_ID + '')
	const fullAddress = `${order.address.detailedAddress}, ${order.address.ward.name}, ${order.address.district.name}, ${order.address.province.name}`
	console.log('order', order)
	return ghn.order.createOrder(
		shopId,
		{
			to_name: order.user.name,
			to_phone: order.user.phoneNumber,
			to_address: fullAddress,
			to_ward_code: order.address.ward.code,
			to_district_id: order.address.district.districtId,
			service_id: order.shippingDetails.shippingServiceId,
			service_type_id: order.shippingDetails.shippingServiceTypeId,
			content: "Thái Ngà Shop",
			weight: order.shippingDetails.weight,
			length: shipping.PACKAGE_LENGTH_DEFAULT,
			width: shipping.PACKAGE_WIDTH_DEFAULT,
			height: shipping.PACKAGE_HEIGHT_DEFAULT,
			payment_type_id: 2,//buyer pay shipping fee
			required_note: 'KHONGCHOXEMHANG',
			cod_amount: order.billing.subTotal,
			insurance_value: order.billing.subTotal,
			note: order.note,
			items: order.orderItems,
		}
	)
}

class Order {
	user: OrderUser
	address: AddressItem
	orderItems: OrderItem[]
	billing: Billing
	status: string
	note: string
	shippingDetails: ShippingDetails
	employee: OrderUser

	constructor(
		user: OrderUser,
		address: AddressItem,
		orderItems: OrderItem[],
		billing: Billing,
		status: string,
		note: string,
		shippingDetails: ShippingDetails,
		employee: OrderUser
	) {
		this.user = user
		this.address = address,
			this.orderItems = orderItems,
			this.billing = billing,
			this.status = status,
			this.note = note,
			this.shippingDetails = shippingDetails,
			this.employee = employee
	}
}
class OrderUser {
	userId: string
	name: string
	phoneNumber: string
	constructor(userId: string, name: string, phoneNumber: string) {
		this.userId = userId,
			this.name = name,
			this.phoneNumber = phoneNumber
	}
}
class AddressItem {
	receiverName: string
	receiverPhoneNumber: string
	province: Province
	district: District
	ward: Ward
	detailedAddress: string
	addressType: string

	constructor(
		receiverName: string,
		receiverPhoneNumber: string,
		province: Province,
		district: District,
		ward: Ward,
		detailedAddress: string,
		addressType: string
	) {
		this.receiverName = receiverName
		this.receiverPhoneNumber = receiverPhoneNumber
		this.province = province
		this.district = district
		this.ward = ward
		this.detailedAddress = detailedAddress
		this.addressType = addressType
	}

}
class Province {
	provinceId: string
	name: string
	code: string

	constructor(provinceId: string, name: string, code: string) {
		this.provinceId = provinceId
		this.name = name
		this.code = code
	}

}
class District {
	districtId: number
	provinceId: number
	name: string
	code: string

	constructor(
		districtId: number,
		provinceId: number,
		name: string,
		code: string
	) {
		this.districtId = districtId
		this.provinceId = provinceId
		this.name = name
		this.code = code
	}
}

class Ward {
	districtId: number
	name: string
	code: string

	constructor(districtId: number, name: string, code: string) {
		this.districtId = districtId
		this.name = name
		this.code = code
	}

}

class OrderItem {
	productId: string
	sku: string
	name: string
	price: number
	imageUrl: string
	quantity: number
	weight: number

	constructor(
		productId: string,
		sku: string,
		name: string,
		price: number,
		imageUrl: string,
		quantity: number,
		weight: number
	) {
		this.productId = productId
		this.sku = sku
		this.name = name
		this.price = price
		this.imageUrl = imageUrl
		this.quantity = quantity
		this.weight = weight
	}
}

class Billing {
	subTotal: number
	shippingFee: number
	estimatedShippingFee: number
	paymentMethod: string

	constructor(
		subTotal: number,
		shippingFee: number,
		estimatedShippingFee: number,
		paymentMethod: string
	) {
		this.subTotal = subTotal
		this.shippingFee = shippingFee
		this.estimatedShippingFee = estimatedShippingFee
		this.paymentMethod = paymentMethod
	}
}

class ShippingDetails {
	weight: number
	shippingProvider: string
	shippingServiceId: number
	shippingServiceTypeId: number
	shippingOrderCode: string
	transType: string
	mainServiceFee: number
	insurance: number
	totalFee: number
	expectedDeliveryTime: string


	constructor(
		weight: number,
		shippingProvider: string,
		shippingServiceId: number,
		shippingServiceTypeId: number,
		shippingOrderCode: string,
		transType: string,
		mainServiceFee: number,
		insurance: number,
		totalFee: number,
		expectedDeliveryTime: string
	) {
		this.weight = weight
		this.shippingProvider = shippingProvider
		this.shippingServiceId = shippingServiceId
		this.shippingServiceTypeId = shippingServiceTypeId
		this.shippingOrderCode = shippingOrderCode
		this.transType = transType
		this.mainServiceFee = mainServiceFee
		this.insurance = insurance
		this.totalFee = totalFee
		this.expectedDeliveryTime = expectedDeliveryTime
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
}