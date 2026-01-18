import { ParsedMenuItem } from "./MenuSharedTypes";

export type MenuTemplateId = 'cafe' | 'bar' | 'restaurant' | 'burger' | 'pizzeria';

export interface MenuTemplate {
    id: MenuTemplateId;
    label: string;
    icon: string;
    description: string;
    items: ParsedMenuItem[];
}

export const MENU_TEMPLATES: Record<MenuTemplateId, MenuTemplate> = {
    cafe: {
        id: 'cafe',
        label: 'Café & Brunch',
        icon: '☕',
        description: 'Menu típico de cafetaria com bebidas quentes, padaria e snacks.',
        items: [
            // Bebidas Quentes
            { produto: 'Expresso', categoria: 'Cafetaria', preco: 1.00, ativo: true },
            { produto: 'Meia de Leite', categoria: 'Cafetaria', preco: 1.50, ativo: true },
            { produto: 'Cappuccino', categoria: 'Cafetaria', preco: 2.50, ativo: true },
            { produto: 'Galão', categoria: 'Cafetaria', preco: 1.80, ativo: true },
            { produto: 'Chá', categoria: 'Cafetaria', preco: 1.50, ativo: true },

            // Padaria
            { produto: 'Croissant Simples', categoria: 'Padaria', preco: 1.20, ativo: true },
            { produto: 'Croissant Misto', categoria: 'Padaria', preco: 2.50, ativo: true },
            { produto: 'Pão com Manteiga', categoria: 'Padaria', preco: 1.00, ativo: true },
            { produto: 'Torrada', categoria: 'Padaria', preco: 2.00, ativo: true },

            // Sumos
            { produto: 'Sumo de Laranja Natural', categoria: 'Bebidas Frias', preco: 2.50, ativo: true },
            { produto: 'Água 33cl', categoria: 'Bebidas Frias', preco: 1.00, ativo: true },
            { produto: 'Refrigerante', categoria: 'Bebidas Frias', preco: 1.80, ativo: true },
        ]
    },
    bar: {
        id: 'bar',
        label: 'Bar Clássico',
        icon: '🍺',
        description: 'Cervejas, cocktails, vinhos e petiscos.',
        items: [
            // Cervejas
            { produto: 'Imperial / Fino', categoria: 'Cervejas', preco: 1.50, ativo: true },
            { produto: 'Caneca', categoria: 'Cervejas', preco: 3.00, ativo: true },
            { produto: 'Cerveja Garrafa', categoria: 'Cervejas', preco: 2.00, ativo: true },
            { produto: 'Sidra', categoria: 'Cervejas', preco: 2.50, ativo: true },

            // Vinhos
            { produto: 'Copo de Vinho Tinto', categoria: 'Vinhos', preco: 3.50, ativo: true },
            { produto: 'Copo de Vinho Branco', categoria: 'Vinhos', preco: 3.50, ativo: true },

            // Cocktails
            { produto: 'Gin Tónico', categoria: 'Cocktails', preco: 8.00, ativo: true },
            { produto: 'Caipirinha', categoria: 'Cocktails', preco: 7.00, ativo: true },
            { produto: 'Mojito', categoria: 'Cocktails', preco: 7.50, ativo: true },

            // Petiscos
            { produto: 'Tremoços', categoria: 'Petiscos', preco: 1.00, ativo: true },
            { produto: 'Azeitonas', categoria: 'Petiscos', preco: 1.50, ativo: true },
            { produto: 'Batata Frita', categoria: 'Petiscos', preco: 2.00, ativo: true },
            { produto: 'Tábua de Queijos', categoria: 'Petiscos', preco: 12.00, ativo: true },
        ]
    },
    burger_joint: {
        id: 'burger',
        label: 'Hamburgueria',
        icon: '🍔',
        description: 'Hambúrgueres, batatas, milkshakes e combos.',
        items: [
            // Burgers
            { produto: 'Cheeseburger', categoria: 'Hambúrgueres', preco: 6.50, ativo: true },
            { produto: 'Bacon Burger', categoria: 'Hambúrgueres', preco: 7.90, ativo: true },
            { produto: 'Vegan Burger', categoria: 'Hambúrgueres', preco: 8.50, ativo: true },
            { produto: 'Double Smash', categoria: 'Hambúrgueres', preco: 9.90, ativo: true },

            // Acompanhamentos
            { produto: 'Batata Frita', categoria: 'Acompanhamentos', preco: 2.50, ativo: true },
            { produto: 'Onion Rings', categoria: 'Acompanhamentos', preco: 3.50, ativo: true },
            { produto: 'Batata Doce Frita', categoria: 'Acompanhamentos', preco: 3.00, ativo: true },

            // Menu
            { produto: 'Menu Clássico', categoria: 'Menus', preco: 10.90, ativo: true },
            { produto: 'Menu Kids', categoria: 'Menus', preco: 6.90, ativo: true },
        ]
    },
    pizzeria: {
        id: 'pizzeria',
        label: 'Pizzaria',
        icon: '🍕',
        description: 'Pizzas clássicas, massas e entradas italianas.',
        items: [
            // Pizzas
            { produto: 'Margherita', categoria: 'Pizzas', preco: 9.00, ativo: true },
            { produto: 'Diavola', categoria: 'Pizzas', preco: 11.00, ativo: true },
            { produto: 'Prosciutto e Funghi', categoria: 'Pizzas', preco: 12.00, ativo: true },
            { produto: 'Quatro Queijos', categoria: 'Pizzas', preco: 13.00, ativo: true },

            // Entradas
            { produto: 'Pão de Alho', categoria: 'Entradas', preco: 3.50, ativo: true },
            { produto: 'Bruschetta', categoria: 'Entradas', preco: 4.50, ativo: true },

            // Bebidas
            { produto: 'Refrigerante Lata', categoria: 'Bebidas', preco: 2.00, ativo: true },
            { produto: 'Vinho da Casa (Jarro)', categoria: 'Bebidas', preco: 8.00, ativo: true },
        ]
    },
    restaurant: {
        id: 'restaurant',
        label: 'Restaurante Geral',
        icon: '🍽️',
        description: 'Entradas, pratos de carne, peixe e sobremesas.',
        items: [
            // Entradas
            { produto: 'Sopa do Dia', categoria: 'Entradas', preco: 2.50, ativo: true },
            { produto: 'Salada Mista', categoria: 'Entradas', preco: 4.50, ativo: true },

            // Carne
            { produto: 'Bife da Casa', categoria: 'Carnes', preco: 14.50, ativo: true },
            { produto: 'Hambúrguer no Prato', categoria: 'Carnes', preco: 11.00, ativo: true },

            // Peixe
            { produto: 'Bacalhau à Brás', categoria: 'Peixes', preco: 12.50, ativo: true },
            { produto: 'Peixe do Dia Grelhado', categoria: 'Peixes', preco: 15.00, ativo: true },

            // Sobremesas
            { produto: 'Mousse de Chocolate', categoria: 'Sobremesas', preco: 3.50, ativo: true },
            { produto: 'Cheesecake', categoria: 'Sobremesas', preco: 4.50, ativo: true },
            { produto: 'Fruta da Época', categoria: 'Sobremesas', preco: 2.00, ativo: true },
        ]
    }
};
