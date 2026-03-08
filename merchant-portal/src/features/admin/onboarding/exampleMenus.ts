/**
 * exampleMenus — Menus de exemplo para onboarding rápido (FASE 2)
 *
 * Permite que novos utilizadores apliquem um menu de exemplo ao seu negócio
 * em vez de criar tudo manualmente, acelerando a primeira venda.
 */

export type BusinessType = "restaurant" | "cafe" | "bar";

export interface ExampleMenuItem {
  name: string;
  price: number; // em cêntimos
  description?: string;
  emoji?: string;
}

export interface ExampleMenuCategory {
  name: string;
  emoji: string;
  items: ExampleMenuItem[];
}

export interface ExampleMenu {
  type: BusinessType;
  label: string;
  description: string;
  emoji: string;
  categories: ExampleMenuCategory[];
}

export const EXAMPLE_MENUS: Record<BusinessType, ExampleMenu> = {
  restaurant: {
    type: "restaurant",
    label: "Restaurante",
    description: "Menu completo com entradas, pratos principais e bebidas",
    emoji: "🍽️",
    categories: [
      {
        name: "Entradas",
        emoji: "🥗",
        items: [
          {
            name: "Sopa do dia",
            price: 350,
            description: "Sopa caseira da cozinha",
            emoji: "🥣",
          },
          {
            name: "Salada mista",
            price: 650,
            description: "Alface, tomate, cebola, cenoura",
            emoji: "🥗",
          },
          {
            name: "Pão com manteiga",
            price: 200,
            description: "Pão artesanal com manteiga",
            emoji: "🍞",
          },
        ],
      },
      {
        name: "Pratos Principais",
        emoji: "🍖",
        items: [
          {
            name: "Prato do dia",
            price: 1050,
            description: "Prato variável conforme cozinha",
            emoji: "🍽️",
          },
          {
            name: "Frango grelhado",
            price: 1200,
            description: "Com batatas e legumes",
            emoji: "🍗",
          },
          {
            name: "Carne assada",
            price: 1450,
            description: "Com arroz e feijão",
            emoji: "🥩",
          },
          {
            name: "Bacalhau à brás",
            price: 1350,
            description: "Bacalhau com batatas palha e ovos",
            emoji: "🐟",
          },
        ],
      },
      {
        name: "Bebidas",
        emoji: "🥤",
        items: [
          {
            name: "Água (0,5L)",
            price: 100,
            description: "Água mineral natural",
            emoji: "💧",
          },
          {
            name: "Refrigerante",
            price: 200,
            description: "Cola, laranja ou limão",
            emoji: "🥤",
          },
          {
            name: "Sumo natural",
            price: 300,
            description: "Laranja, maçã ou misto",
            emoji: "🍊",
          },
          {
            name: "Vinho tinto (copo)",
            price: 250,
            description: "Vinho da região",
            emoji: "🍷",
          },
          {
            name: "Cerveja (caneca)",
            price: 200,
            description: "Cerveja nacional",
            emoji: "🍺",
          },
        ],
      },
      {
        name: "Sobremesas",
        emoji: "🍮",
        items: [
          {
            name: "Pudim flan",
            price: 350,
            description: "Pudim caseiro com caramelo",
            emoji: "🍮",
          },
          {
            name: "Mousse de chocolate",
            price: 350,
            description: "Mousse suave de chocolate negro",
            emoji: "🍫",
          },
        ],
      },
    ],
  },

  cafe: {
    type: "cafe",
    label: "Café / Pastelaria",
    description: "Café, bebidas quentes, doces e salgados",
    emoji: "☕",
    categories: [
      {
        name: "Cafés",
        emoji: "☕",
        items: [
          { name: "Espresso", price: 80, emoji: "☕" },
          { name: "Meia de leite", price: 120, emoji: "☕" },
          { name: "Galão", price: 130, emoji: "🥛" },
          { name: "Cappuccino", price: 180, emoji: "☕" },
          { name: "Descafeinado", price: 90, emoji: "☕" },
          { name: "Chá", price: 100, emoji: "🍵" },
        ],
      },
      {
        name: "Salgados",
        emoji: "🥐",
        items: [
          {
            name: "Tosta mista",
            price: 350,
            description: "Fiambre e queijo",
            emoji: "🥪",
          },
          {
            name: "Croissant simples",
            price: 130,
            description: "Croissant folhado",
            emoji: "🥐",
          },
          {
            name: "Sandes de frango",
            price: 450,
            description: "Frango grelhado com alface",
            emoji: "🥙",
          },
          {
            name: "Prego no pão",
            price: 550,
            description: "Carne grelhada picante",
            emoji: "🥩",
          },
        ],
      },
      {
        name: "Doces",
        emoji: "🍰",
        items: [
          {
            name: "Pastel de nata",
            price: 130,
            description: "Pastel de nata fresco",
            emoji: "🥧",
          },
          {
            name: "Bola de Berlim",
            price: 200,
            description: "Com creme de pasteleiro",
            emoji: "🍩",
          },
          {
            name: "Queque",
            price: 150,
            description: "Queque de baunilha",
            emoji: "🧁",
          },
          {
            name: "Fatia de bolo",
            price: 250,
            description: "Bolo variado do dia",
            emoji: "🍰",
          },
        ],
      },
      {
        name: "Sumos e Frescos",
        emoji: "🧃",
        items: [
          {
            name: "Sumo de laranja natural",
            price: 250,
            description: "Espremido na hora",
            emoji: "🍊",
          },
          {
            name: "Água (0,5L)",
            price: 100,
            emoji: "💧",
          },
          {
            name: "Refrigerante",
            price: 180,
            emoji: "🥤",
          },
        ],
      },
    ],
  },

  bar: {
    type: "bar",
    label: "Bar / Pub",
    description: "Cervejas, cocktails, shots e tapas",
    emoji: "🍺",
    categories: [
      {
        name: "Cervejas",
        emoji: "🍺",
        items: [
          {
            name: "Cerveja nacional (caneca)",
            price: 200,
            description: "0,3L pressão",
            emoji: "🍺",
          },
          {
            name: "Cerveja nacional (imperial)",
            price: 150,
            description: "0,2L pressão",
            emoji: "🍺",
          },
          {
            name: "Cerveja garrafa (33cl)",
            price: 250,
            description: "Cerveja importada em garrafa",
            emoji: "🍾",
          },
          {
            name: "Cerveja sem álcool",
            price: 200,
            description: "0% - 0,33L",
            emoji: "🍺",
          },
        ],
      },
      {
        name: "Cocktails",
        emoji: "🍹",
        items: [
          {
            name: "Mojito",
            price: 700,
            description: "Rum, lima, hortelã, açúcar, água com gás",
            emoji: "🍹",
          },
          {
            name: "Caipirinha",
            price: 700,
            description: "Cachaça, lima, açúcar",
            emoji: "🍋",
          },
          {
            name: "Gin tónico",
            price: 800,
            description: "Gin premium com tónica artesanal",
            emoji: "🫙",
          },
          {
            name: "Spritz",
            price: 650,
            description: "Aperol, prosecco, água com gás",
            emoji: "🍷",
          },
        ],
      },
      {
        name: "Shots & Spirits",
        emoji: "🥃",
        items: [
          { name: "Whisky (dose)", price: 450, emoji: "🥃" },
          { name: "Vodka (dose)", price: 350, emoji: "🥃" },
          { name: "Shot variado", price: 300, emoji: "🔥" },
        ],
      },
      {
        name: "Tapas / Petiscos",
        emoji: "🧆",
        items: [
          {
            name: "Tábua de queijos",
            price: 900,
            description: "Seleção de queijos com pão",
            emoji: "🧀",
          },
          {
            name: "Pica-pau",
            price: 750,
            description: "Carne picada, pickles, mostarda",
            emoji: "🍢",
          },
          {
            name: "Nachos",
            price: 650,
            description: "Com guacamole e molho de queijo",
            emoji: "🌮",
          },
          {
            name: "Batatas fritas",
            price: 350,
            description: "Crocantes com sal",
            emoji: "🍟",
          },
        ],
      },
      {
        name: "Não Alcoólicos",
        emoji: "🧃",
        items: [
          { name: "Refrigerante", price: 200, emoji: "🥤" },
          { name: "Água (0,5L)", price: 100, emoji: "💧" },
          {
            name: "Sumo de laranja",
            price: 300,
            description: "Espremido natural",
            emoji: "🍊",
          },
        ],
      },
    ],
  },
};

/** Total number of items across all categories */
export function countMenuItems(menu: ExampleMenu): number {
  return menu.categories.reduce((sum, cat) => sum + cat.items.length, 0);
}
