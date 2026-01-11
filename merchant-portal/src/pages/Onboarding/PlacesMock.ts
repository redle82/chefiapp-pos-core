export type GooglePlace = {
    placeId: string;
    name: string;
    address: string;
    city: string;
    countryCode: string;
    lat: number;
    lng: number;
    category: 'Restaurant' | 'Cafe' | 'Bar' | 'FastFood' | 'Other';
    rating: number;
    reviewCount: number;
    status: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';
    website?: string;
    phone?: string;
    hours?: string;
}

const MOCK_PLACES: GooglePlace[] = [
    {
        placeId: 'ch-sofia-01',
        name: 'Sofia Gastrobar',
        address: 'Carrer des Caló, 109',
        city: 'Sant Agustí des Vedrà (Ibiza)',
        countryCode: 'ES',
        lat: 38.9696849,
        lng: 1.2741235,
        category: 'Bar',
        rating: 4.8,
        reviewCount: 342,
        status: 'OPERATIONAL',
        website: 'https://sofiagastrobar.es',
        phone: '+34 971 000 000',
        hours: 'Lun-Dom: 13:00-02:00'
    },
    {
        placeId: 'ch-bistro-02',
        name: 'ChefIApp Bistro',
        address: 'Avenida da Liberdade, 45',
        city: 'Lisboa',
        countryCode: 'PT',
        lat: 38.7223,
        lng: -9.1448,
        category: 'Restaurant',
        rating: 4.5,
        reviewCount: 156,
        status: 'OPERATIONAL',
        website: 'https://chefiappbistro.com',
        phone: '+351 210 111 222',
        hours: 'Ter-Dom: 11:30-22:00'
    },
    {
        placeId: 'ch-paulista-03',
        name: 'Padaria Paulista Real',
        address: 'Avenida Paulista, 1000',
        city: 'São Paulo',
        countryCode: 'BR',
        lat: -23.5611,
        lng: -46.6559,
        category: 'Cafe',
        rating: 4.2,
        reviewCount: 2890,
        status: 'OPERATIONAL',
        website: 'https://paulistareal.com.br',
        phone: '+55 11 3000-0000',
        hours: '24h'
    }
];

export const PlacesMock = {
    search: async (query: string): Promise<GooglePlace[]> => {
        await new Promise(r => setTimeout(r, 600)); // Simulate API delay
        if (!query.trim()) return [];

        const isUrl = query.startsWith('http') || query.includes('google.com/maps');

        if (isUrl) {
            // If it's a URL, find a keyword match to our mocks
            const lowerUrl = query.toLowerCase();
            if (lowerUrl.includes('sofia')) return [MOCK_PLACES[0]];
            if (lowerUrl.includes('bistro')) return [MOCK_PLACES[1]];
            if (lowerUrl.includes('paulista')) return [MOCK_PLACES[2]];
            return [];
        }

        // Initial simple filter
        const directMatches = MOCK_PLACES.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.address.toLowerCase().includes(query.toLowerCase())
        );

        // If specific mocks found, return them
        if (directMatches.length > 0) return directMatches;

        // Otherwise generate generic results to feel "real"
        if (query.length > 3) {
            return [
                {
                    placeId: `gen-${Math.random()}`,
                    name: `${query} Original`,
                    address: 'Rua Principal, 123',
                    city: 'Lisboa',
                    countryCode: 'PT',
                    lat: 0, lng: 0,
                    category: 'Restaurant',
                    rating: 4.5, reviewCount: 120,
                    status: 'OPERATIONAL'
                },
                {
                    placeId: `gen-${Math.random()}`,
                    name: `${query} Experience`,
                    address: 'Av. Liberdade, 500',
                    city: 'Lisboa',
                    countryCode: 'PT',
                    lat: 0, lng: 0,
                    category: 'Bar',
                    rating: 4.2, reviewCount: 45,
                    status: 'OPERATIONAL'
                },
                {
                    placeId: `gen-${Math.random()}`,
                    name: `${query} Express`,
                    address: 'Rua de Baixo, 22',
                    city: 'Porto',
                    countryCode: 'PT',
                    lat: 0, lng: 0,
                    category: 'FastFood',
                    rating: 3.9, reviewCount: 80,
                    status: 'OPERATIONAL'
                }
            ];
        }

        return [];
    },
    getDetails: async (placeId: string): Promise<GooglePlace | null> => {
        await new Promise(r => setTimeout(r, 400));
        return MOCK_PLACES.find(p => p.placeId === placeId) || null;
    }
};
