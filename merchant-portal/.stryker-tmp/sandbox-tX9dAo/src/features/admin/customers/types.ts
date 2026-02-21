export type CustomerSource =
  | "Uber"
  | "Glovo"
  | "JustEat"
  | "OwnDelivery"
  | "GloriaFood"
  | "QR"
  | "TPV"
  | "Web";

export interface Customer {
  id: string;
  name: string;
  email?: string;
  source: CustomerSource;
  totalSpent: number;
  averageSpent: number;
  tabsCount: number;
  lastOrderAt: string;
  locationName: string;
  rating?: number;
}

export interface CustomersKPIs {
  customersCount: number;
  customersAverageTabs: number;
  customersAverageAmount: number;
  customersAverageAmountPerTab: number;
  customersAverageRating: number | null;
}

export interface GetCustomersParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface GetCustomersResult {
  data: Customer[];
  total: number;
}
