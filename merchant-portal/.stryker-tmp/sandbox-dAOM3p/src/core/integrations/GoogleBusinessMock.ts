// @ts-nocheck
export interface GoogleBusinessProfile {
  id: string;
  description: string;
  title: string;
  category: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  rating: number;
  reviewsCount: number;
  website?: string;
  images: string[];
  openingHours: {
    open_now: boolean;
    periods: any[];
  };
}

const MOCK_PROFILE: GoogleBusinessProfile = {
  id: "gmb_123456789",
  title: "ChefIApp Bistro Trial",
  description: "A modern bistro showcasing the power of ChefIApp Sovereign OS.",
  category: "Restaurant",
  address: {
    street: "Rua da Inovação, 42",
    city: "Lisboa",
    postalCode: "1000-001",
    country: "Portugal",
  },
  rating: 4.8,
  reviewsCount: 124,
  website: "https://chefiapp.com",
  images: ["https://placehold.co/600x400?text=Bistro+Cover"],
  openingHours: {
    open_now: true,
    periods: [],
  },
};

export const GoogleBusinessMock = {
  // Simulate searching and selecting a business
  connect: async (): Promise<GoogleBusinessProfile> => {
    console.log(
      "[GoogleBusinessMock] 📡 Connecting to Google Business Profile...",
    );
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Network latency
    console.log("[GoogleBusinessMock] ✅ Connected to:", MOCK_PROFILE.title);
    return MOCK_PROFILE;
  },
};
