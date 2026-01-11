
export const BRAND_GROUPS = {
    coca: {
        id: 'coca',
        label: 'Coca-Cola',
        color: 'red',
        items: [
            { id: 'coca', name: 'Coca-Cola', price: '2.00', selected: true },
            { id: 'coca_zero', name: 'Coca-Cola Zero', price: '2.00', selected: true },
            { id: 'fanta', name: 'Fanta Laranja', price: '2.00', selected: true },
            { id: 'sprite', name: 'Sprite', price: '2.00', selected: true },
            { id: 'nestea', name: 'Nestea', price: '2.00', selected: false },
        ]
    },
    pepsi: {
        id: 'pepsi',
        label: 'Pepsi',
        color: 'blue',
        items: [
            { id: 'pepsi', name: 'Pepsi', price: '2.00', selected: true },
            { id: 'pepsi_max', name: 'Pepsi Max', price: '2.00', selected: true },
            { id: 'sumol', name: 'Sumol', price: '2.00', selected: true },
            { id: '7up', name: '7Up', price: '2.00', selected: true },
            { id: 'lipton', name: 'Lipton Ice Tea', price: '2.00', selected: false },
        ]
    }
};

export const BEVERAGE_TEMPLATES = {
    // Soft drinks will now be dynamic, but we keep a fallback structure 
    // or we can remove the static 'soft' key if the component handles it dynamically.
    // For safety, we keep 'soft' as the default (Coca) for initial render.
    soft: {
        id: 'soft',
        label: 'Refrigerantes',
        isBranded: true, // Marker for component to show toggle
        items: BRAND_GROUPS.coca.items
    },
    water: {
        id: 'water',
        label: 'Águas',
        items: [
            { id: 'water_s', name: 'Água (Pequena)', price: '1.50', selected: true },
            { id: 'water_l', name: 'Água (Grande)', price: '2.50', selected: false },
            { id: 'sparkling', name: 'Água com Gás', price: '1.80', selected: true },
        ]
    },
    beer: {
        id: 'beer',
        label: 'Cervejas',
        items: [
            { id: 'beer_draft', name: 'Imperial / Fino', price: '2.00', selected: true },
            { id: 'beer_bottle', name: 'Cerveja Garrafa', price: '2.50', selected: true },
            { id: 'beer_craft', name: 'Cerveja Artesanal', price: '4.50', selected: false },
        ]
    },
    coffee: {
        id: 'coffee',
        label: 'Cafetaria',
        items: [
            { id: 'espresso', name: 'Café Expresso', price: '1.00', selected: true },
            { id: 'cappucino', name: 'Cappuccino', price: '2.50', selected: false },
            { id: 'latte', name: 'Galão / Meia de Leite', price: '2.00', selected: false },
        ]
    }
};
