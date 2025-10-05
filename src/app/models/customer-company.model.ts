export interface CustomerCompany {
  id: string;
  customerId: string;
  companyId: string;
  createdDate: Date;
}

export interface LinkCustomerCompanyRequest {
  customerId: string;
  companyId: string;
}
