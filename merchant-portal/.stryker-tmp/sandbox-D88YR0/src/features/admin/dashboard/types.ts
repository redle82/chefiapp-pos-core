export type DashboardOverview = {
  locationId: string;
  tables: { total: number; occupied: number };
  seats: { total: number; occupied: number };
  revenueByHour: { hour: string; amount: number }[];
  general: {
    deletedProducts: number;
    deletedPayments: number;
    discounts: number;
    pendingAmount: number;
  };
  stats: {
    totalBills: number;
    totalSeats: number;
    avgSeatsPerBill: number;
    avgAmountPerBill: number;
    avgAmountPerSeat: number;
  };
  operation?: {
    activeStaffCount: number;
    criticalTasksCount: number;
    alertsCount: number;
  };
};

