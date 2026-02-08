import type {
  Customer,
  CustomersKPIs,
  GetCustomersParams,
  GetCustomersResult,
} from "../types";

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "6bd754b9",
    name: "Megan",
    email: "megan@example.com",
    source: "OwnDelivery",
    totalSpent: 3783.6,
    averageSpent: 40.25,
    tabsCount: 98,
    lastOrderAt: "2023-07-12T23:00:00.000Z",
    locationName: "SOFIA GASTROBAR IBIZA",
    rating: 4.2,
  },
  {
    id: "8795537e",
    name: "any",
    email: "any@example.com",
    source: "OwnDelivery",
    totalSpent: 807.7,
    averageSpent: 50.48,
    tabsCount: 18,
    lastOrderAt: "2025-05-18T21:26:00.000Z",
    locationName: "SOFIA GASTROBAR IBIZA",
    rating: 3.8,
  },
  {
    id: "4ae5e010",
    name: "Elde",
    email: "elde@example.com",
    source: "GloriaFood",
    totalSpent: 879.0,
    averageSpent: 79.91,
    tabsCount: 13,
    lastOrderAt: "2025-05-16T15:56:00.000Z",
    locationName: "SOFIA GASTROBAR IBIZA",
    rating: 4.5,
  },
  {
    id: "695f7384",
    name: "George",
    email: "george@example.com",
    source: "Uber",
    totalSpent: 932.5,
    averageSpent: 71.73,
    tabsCount: 13,
    lastOrderAt: "2025-09-12T21:37:00.000Z",
    locationName: "SOFIA GASTROBAR IBIZA",
    rating: 4.0,
  },
  {
    id: "2ad4589c",
    name: "andrew",
    email: "andrew@example.com",
    source: "Uber",
    totalSpent: 808.5,
    averageSpent: 67.38,
    tabsCount: 13,
    lastOrderAt: "2023-10-25T20:09:00.000Z",
    locationName: "SOFIA GASTROBAR IBIZA",
    rating: 3.9,
  },
  {
    id: "b1cf2209",
    name: "Mollie",
    email: "mollie@example.com",
    source: "JustEat",
    totalSpent: 235.5,
    averageSpent: 26.17,
    tabsCount: 9,
    lastOrderAt: "2025-10-25T21:55:00.000Z",
    locationName: "SOFIA GASTROBAR IBIZA",
    rating: 3.5,
  },
  {
    id: "a2b3c4d5",
    name: "Sofia",
    email: "sofia@example.com",
    source: "QR",
    totalSpent: 1250.0,
    averageSpent: 62.5,
    tabsCount: 20,
    lastOrderAt: "2025-02-01T19:30:00.000Z",
    locationName: "SOFIA GASTROBAR IBIZA",
    rating: 4.8,
  },
  {
    id: "e6f7g8h9",
    name: "Carlos",
    email: "carlos@example.com",
    source: "TPV",
    totalSpent: 450.0,
    averageSpent: 45.0,
    tabsCount: 10,
    lastOrderAt: "2025-01-15T14:00:00.000Z",
    locationName: "SOFIA GASTROBAR IBIZA",
    rating: 4.1,
  },
  {
    id: "i0j1k2l3",
    name: "Maria",
    email: "maria@example.com",
    source: "Glovo",
    totalSpent: 680.2,
    averageSpent: 56.68,
    tabsCount: 12,
    lastOrderAt: "2025-02-03T20:15:00.000Z",
    locationName: "SOFIA GASTROBAR IBIZA",
    rating: 3.7,
  },
  {
    id: "m4n5o6p7",
    name: "Pedro",
    email: "pedro@example.com",
    source: "Web",
    totalSpent: 320.5,
    averageSpent: 32.05,
    tabsCount: 10,
    lastOrderAt: "2025-01-28T18:45:00.000Z",
    locationName: "SOFIA GASTROBAR IBIZA",
    rating: 4.3,
  },
];

function matchesSearch(c: Customer, search: string): boolean {
  if (!search.trim()) return true;
  const q = search.trim().toLowerCase();
  return (
    c.name.toLowerCase().includes(q) ||
    (c.email?.toLowerCase().includes(q) ?? false) ||
    c.id.toLowerCase().includes(q) ||
    c.source.toLowerCase().includes(q)
  );
}

export async function getCustomersKPIs(): Promise<CustomersKPIs> {
  const list = MOCK_CUSTOMERS;
  const total = list.length;
  if (total === 0) {
    return {
      customersCount: 0,
      customersAverageTabs: 0,
      customersAverageAmount: 0,
      customersAverageAmountPerTab: 0,
      customersAverageRating: null,
    };
  }
  const totalTabs = list.reduce((s, c) => s + c.tabsCount, 0);
  const totalSpent = list.reduce((s, c) => s + c.totalSpent, 0);
  const ratings = list.filter((c) => c.rating != null).map((c) => c.rating!);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;
  return {
    customersCount: total,
    customersAverageTabs: totalTabs / total,
    customersAverageAmount: totalSpent / total,
    customersAverageAmountPerTab: totalTabs > 0 ? totalSpent / totalTabs : 0,
    customersAverageRating: avgRating,
  };
}

export async function getCustomers(
  params: GetCustomersParams = {}
): Promise<GetCustomersResult> {
  const { search = "", page = 1, pageSize = 10 } = params;
  const filtered = MOCK_CUSTOMERS.filter((c) => matchesSearch(c, search));
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);
  return { data, total };
}
