export type CustomerSource =
  | "Uber"
  | "Glovo"
  | "JustEat"
  | "OwnDelivery"
  | "GloriaFood"
  | "QR"
  | "TPV"
  | "Web";

export type CustomerSegment = "new" | "regular" | "vip" | "at_risk" | "lost";

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  source: CustomerSource;
  totalSpent: number;
  averageSpent: number;
  tabsCount: number;
  lastOrderAt: string;
  locationName: string;
  rating?: number;
  segment?: CustomerSegment;
  dietaryPreferences?: string[];
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
  segment?: CustomerSegment | null;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface GetCustomersResult {
  data: Customer[];
  total: number;
}
