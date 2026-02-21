/**
 * MenuCatalogPageV2 — Versão premium do catálogo visual
 * Contrato: MENU_VISUAL_RUNTIME_CONTRACT.md — conteúdo emerge por detrás do hero; onda recorta.
 * Dados: Docker Core (MenuCatalogReader) quando restaurant_id disponível; senão mock.
 * Rota: /menu-v2
 */
// @ts-nocheck


import { useMemo, useState } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { DishModal } from "./components/DishModal";
import { MenuCategorySection } from "./components/MenuCategorySection";
import { MenuHero } from "./components/MenuHero";
import { MenuRecommendations } from "./components/MenuRecommendations";
import { MenuSearch, type MenuFilters } from "./components/MenuSearch";
import type { CatalogCategory, CatalogItem, MenuRestaurant } from "./types";
import { useMenuCatalog } from "./useMenuCatalog";

// Contrato MENU_VISUAL_RUNTIME: no hero só logo pequeno (max 80px) ou monograma; nunca foto de ambiente/restaurante no centro.
const MOCK_RESTAURANT: MenuRestaurant = {
  name: "Gringo's Parrilla Mexicana",
  logoUrl: undefined, // monograma no hero; ou URL de logo pequeno/quadrado (nunca foto de espaço)
  heroMedia:
    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=80",
  tagline: "O cliente decide com os olhos antes de decidir com a cabeça.",
  seals: ["TripAdvisor", "Recomendado pelo Chef", "Chef", "Mais pedido"],
  language: "es",
};

const MOCK_CATEGORIES_V2: CatalogCategory[] = [
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
        badges: ["chef", "veggie"],
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
        badges: ["mais_pedido"],
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
        badges: ["novidade"],
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
        badges: ["mais_pedido", "chef"],
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
        description: "Crema de chocolate negro con galleta crujiente.",
        priceCents: 750,
        imageUrl:
          "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80",
        allergens: ["gluten", "huevos", "lacteos"],
        badges: ["chef"],
      },
    ],
  },
];

export function MenuCatalogPageV2() {
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [searchResults, setSearchResults] = useState<CatalogItem[]>([]);
  const [filters, setFilters] = useState<MenuFilters>({
    query: "",
    vegetarian: false,
    glutenFree: false,
    vegan: false,
    spicy: false,
  });

  const { runtime } = useRestaurantRuntime();
  const { restaurant, categories, loading, fromCore } = useMenuCatalog(
    runtime.restaurant_id ?? null,
  );

  const displayRestaurant: MenuRestaurant = restaurant
    ? { ...MOCK_RESTAURANT, ...restaurant }
    : MOCK_RESTAURANT;
  // Fallback para mock quando Core não tem catálogo (404 em gm_catalog_menus) ou ainda a carregar
  const displayCategories: CatalogCategory[] =
    fromCore && categories.length > 0 ? categories : MOCK_CATEGORIES_V2;
  const safeCategories =
    displayCategories.length > 0 ? displayCategories : MOCK_CATEGORIES_V2;

  const allItems = safeCategories.flatMap((c) => c.items);

  // Determine which items to display based on search
  const itemsToDisplay = filters.query.trim() ? searchResults : allItems;

  const handleVerPrato = (item: CatalogItem) => setSelectedItem(item);
  const handlePedir = (_item: CatalogItem) => {
    // CTA; integração futura com Core
  };

  const handleSearch = (results: CatalogItem[]) => {
    setSearchResults(results);
  };

  const handleFilterChange = (newFilters: MenuFilters) => {
    setFilters(newFilters);
  };

  // Filter categories to only include items in search results
  const displayCategoriesFiltered = useMemo(() => {
    if (!filters.query.trim()) return safeCategories;

    return safeCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) =>
          searchResults.some((i) => i.id === item.id),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [safeCategories, filters.query, searchResults]);

  // Segundo ramo do ternário como variável para evitar ambiguidade de parsing (evitar 500 no Vite)
  const categoryList = displayCategoriesFiltered.map((category) => (
    <MenuCategorySection
      key={category.id}
      id={category.id}
      title={category.title}
      items={category.items}
      onVerPrato={handleVerPrato}
      onPedir={handlePedir}
      usePremium
      animateOnScroll
    />
  ));

  // Recomendações: itens com badges chef, mais_pedido, novidade (máx. 6)
  const recommendationBadges = new Set([
    "chef",
    "mais_pedido",
    "novidade",
    "tripadvisor",
  ]);
  const recommendedItems = safeCategories
    .flatMap((c) => c.items)
    .filter((item) =>
      (item.badges ?? []).some((b) => recommendationBadges.has(b)),
    )
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* MENU_HEADER_WAVE_CONTRACT: clipPath define forma inferior do header (onda); fundo = neutral-100 para sem borda branca */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <clipPath id="hero-wave-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0 0 L 1 0 L 1 0.88 Q 0.75 0.96 0.5 0.88 Q 0.25 0.96 0 0.88 Z" />
          </clipPath>
        </defs>
      </svg>
      <MenuHero
        restaurant={displayRestaurant}
        language={displayRestaurant.language}
        onLanguageChange={() => {}}
      />

      {/* Spacer: reserva espaço no fluxo para o hero fixo (70vh) — conteúdo não fica escondido atrás do hero */}
      <div className="h-[70vh] shrink-0 bg-neutral-100" aria-hidden />

      {/* MENU_VISUAL_RUNTIME_CONTRACT: conteúdo entra por trás do header; mesmo fundo neutral-100; sem container branco entre header e menu */}
      <section
        className="menu-content relative z-10 -mt-[30vh] pt-[40vh] bg-neutral-100"
        aria-label="Catálogo do menu"
      >
        {/* Menu Search — Barra de busca inteligente e filtros */}
        <div className="sticky top-0 z-20 bg-neutral-100">
          <MenuSearch
            items={allItems}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
          />
        </div>

        <main className="max-w-2xl mx-auto pb-24 md:max-w-3xl">
          {loading && safeCategories.length === 0 ? (
            <p className="px-4 py-8 text-neutral-500 text-center">
              A carregar catálogo…
            </p>
          ) : (
            <>
              {/* Menu Recommendations — Apenas quando não está fazendo busca */}
              {!filters.query.trim() && (
                <MenuRecommendations
                  items={allItems}
                  onVerPrato={handleVerPrato}
                  onPedir={handlePedir}
                  usePremium
                />
              )}

              {/* Categories */}
              {itemsToDisplay.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-neutral-500 text-base">
                    😢 Nenhum prato encontrado com seus filtros
                  </p>
                  <button
                    onClick={() => {
                      setFilters({
                        query: "",
                        vegetarian: false,
                        glutenFree: false,
                        vegan: false,
                        spicy: false,
                      });
                      setSearchResults([]);
                    }}
                    className="mt-3 text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                categoryList
              )}
            </>
          )}
        </main>
      </section>

      {selectedItem && (
        <DishModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onPedir={handlePedir}
          usePremium
        />
      )}
    </div>
  );
}
