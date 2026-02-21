/**
 * MenuCatalogPage — Catálogo visual de decisão
 * Spec: MENU_CATALOG_VISUAL_SPEC.md; Contrato: MENU_VISUAL_CONTRACT.md
 * Compoção: RestaurantHeader + MenuCategorySection(s) + DishModal
 * Tablet-first (≥834px); narrativa Seduz → Confirma → Executa.
 */

import { useState } from "react";
import type { CatalogCategory, CatalogItem } from "./types";
import { RestaurantHeader } from "./components/RestaurantHeader";
import { MenuCategorySection } from "./components/MenuCategorySection";
import { DishModal } from "./components/DishModal";

const MOCK_CATEGORIES: CatalogCategory[] = [
  {
    id: "entrantes",
    title: "Entrantes",
    items: [
      {
        id: "1",
        title: "Tabla de quesos",
        description:
          "Selección de quesos nacionales elaborados de forma tradicional.",
        priceCents: 2200,
        imageUrl:
          "https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&q=80",
        allergens: ["lacteos"],
      },
      {
        id: "2",
        title: "Gambas al ajillo",
        description:
          "Jugosas gambas frescas al ajillo con aceite de oliva virgen extra.",
        priceCents: 1290,
        imageUrl:
          "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
        allergens: ["crustaceos"],
      },
    ],
  },
  {
    id: "carnes",
    title: "Carnes",
    items: [
      {
        id: "3",
        title: "Costillas a la brasa",
        description: "Costillas a la brasa con salsa barbacoa.",
        priceCents: 2300,
        imageUrl:
          "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
        allergens: [],
      },
      {
        id: "4",
        title: "Hamburguesa cheddar",
        description:
          "Carne de vacuno a la parrilla, queso cheddar fundido, pan artesanal.",
        priceCents: 1800,
        imageUrl:
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
        allergens: ["gluten", "lacteos"],
      },
    ],
  },
  {
    id: "postres",
    title: "Postres",
    items: [
      {
        id: "5",
        title: "Crema de chocolate",
        description:
          "Crema de chocolate negro con galleta crujiente.",
        priceCents: 750,
        imageUrl:
          "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80",
        allergens: ["gluten", "huevos", "lacteos"],
      },
    ],
  },
];

const MOCK_RESTAURANT = {
  name: "Gringo's Parrilla Mexicana",
  heroImageUrl:
    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=80",
  badgeLabel: "Recomendación del chef",
  language: "es" as const,
};

export function MenuCatalogPage() {
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  const handleVerPrato = (item: CatalogItem) => setSelectedItem(item);
  const handlePedir = (_item: CatalogItem) => {
    // CTA; integração futura com Core
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <RestaurantHeader
        restaurantName={MOCK_RESTAURANT.name}
        heroImageUrl={MOCK_RESTAURANT.heroImageUrl}
        badgeLabel={MOCK_RESTAURANT.badgeLabel}
        language={MOCK_RESTAURANT.language}
      />

      <main className="max-w-2xl mx-auto pb-24 md:max-w-3xl">
        {MOCK_CATEGORIES.map((category) => (
          <MenuCategorySection
            key={category.id}
            id={category.id}
            title={category.title}
            items={category.items}
            onVerPrato={handleVerPrato}
            onPedir={handlePedir}
          />
        ))}
      </main>

      {selectedItem && (
        <DishModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onPedir={handlePedir}
        />
      )}
    </div>
  );
}
