import GHN from "giaohangnhanh";
const ghn: GHN = new GHN(process.env.GHN_API_KEY_TEST ? process.env.GHN_API_KEY_TEST : "", { test: true })
const createStore = async (districtId: number, wardCode: string, store: Store) => {
	return ghn.store.createStore(
		districtId,
		wardCode,
		store
	)
}

class Store {
	_id?: number;
	name: string;
	phone: string;
	address: string;
	ward_code?: string;
	district_id?: number;
	client_id?: number;
	bank_account_id?: number;
	status?: number;
	location?: any;
	version_no?: string;
	updated_ip?: string;
	updated_employee?: number;
	updated_client?: number;
	updated_source?: string;
	updated_date?: string;
	created_ip?: string;
	created_employee?: number;
	created_client?: number;
	created_source?: string;
	created_date?: string;
	constructor(
		name: string,
		phone: string,
		address: string,
		/*ward_code?: string,
		district_id?: number,
		client_id?: number,
		bank_account_id?: number,
		status?: number,
		location?: any,
		version_no?: string,
		updated_ip?: string,
		updated_employee?: number,
		updated_client?: number,
		updated_source?: string,
		updated_date?: string,
		created_ip?: string,
		created_employee?: number,
		created_client?: number,
		created_source?: string,
		created_date?: string,*/) {
		this.name = name,
			this.phone = phone,
			this.address = address
	}
}
module.exports = {
	createStore
}