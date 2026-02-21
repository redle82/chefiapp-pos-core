# 📖 GUIA DE IMPLEMENTAÇÃO - MELHORIAS DO MENU

## 🆕 Novos Componentes

### 1. MenuSearch

**Uso**: Barra de busca inteligente com filtros rápidos

```tsx
import { MenuSearch, type MenuFilters } from "./components/MenuSearch";
import type { CatalogItem } from "./types";

const items: CatalogItem[] = [...]; // De uma categoria

export function MeuComponente() {
  const [searchResults, setSearchResults] = useState<CatalogItem[]>([]);
  const [filters, setFilters] = useState<MenuFilters>();

  const handleSearch = (results: CatalogItem[]) => {
    setSearchResults(results);
  };

  const handleFilterChange = (filters: MenuFilters) => {
    setFilters(filters);
  };

  return (
    <MenuSearch
      items={items}
      onSearch={handleSearch}
      onFilterChange={handleFilterChange}
    />
  );
}
```

**Props**:

- `items`: Array de CatalogItem[]
- `onSearch`: Callback com resultados filtrados
- `onFilterChange`: Callback com filtros ativos

**Features**:

- ✅ Busca por texto (nome, descrição)
- ✅ Filtros rápidos: Vegetariano, Sem Glúten, Vegano, Picante
- ✅ Resultado em tempo real
- ✅ Contador de resultados
- ✅ Botão Limpar filtros

---

### 2. MenuRecommendations

**Uso**: Seção de recomendações contextuais (Chef, Popular, Novidades)

```tsx
import { MenuRecommendations } from "./components/MenuRecommendations";

export function MeuCardapio() {
  const allItems: CatalogItem[] = [...];

  return (
    <MenuRecommendations
      items={allItems}
      onVerPrato={handleViewDish}
      onPedir={handleOrder}
      usePremium={true}
    />
  );
}
```

**Props**:

- `items`: Array de todos os itens
- `onVerPrato`: Callback ao clicar num prato
- `onPedir`: Callback ao clicar "Pedir"
- `usePremium`: Usa badges visuais (true recomendado)

**Renderiza Automaticamente**:

- 👨‍🍳 Recomendações do Chef (badge "chef")
- 🔥 Mais Pedidos (badge "mais_pedido")
- ✨ Novidades (badge "novidade")
- ⭐ Popular (combinação social proof)

---

### 3. MenuAvailability

**Uso**: Indicador de disponibilidade em tempo real

```tsx
import {
  MenuAvailability,
  DisabledProductOverlay,
} from "./components/MenuAvailability";

export function ProductCard({ item }: { item: CatalogItem }) {
  const availability = {
    isAvailable: item.isAvailable ?? true,
    reason: item.availabilityReason,
    willBeAvailableAt: item.willBeAvailableAt,
  };

  return (
    <div className="relative">
      {/* Card conteúdo */}
      <img src={item.imageUrl} alt="" />

      {/* Se indisponível, mostrar overlay + badge */}
      {!availability.isAvailable && <DisabledProductOverlay />}

      {/* Info de disponibilidade expandida (em modal, por ex.) */}
      <MenuAvailability
        status={availability}
        displaySize="full"
        onNotifyClick={() => console.log("Me avise quando voltar")}
      />
    </div>
  );
}
```

**Props**:

- `status`: AvailabilityStatus
- `displaySize`: "compact" | "full"
- `onNotifyClick`: Callback para "Me avise"

**AvailabilityStatus**:

```ts
interface AvailabilityStatus {
  isAvailable: boolean;
  reason?: "out_of_stock" | "not_yet_available" | "sold_out";
  availableAt?: string; // ISO date
  willBeAvailableAt?: string; // "HH:MM"
}
```

---

### 4. Badge Melhorado

**Uso**: Badges visuais com emoji

```tsx
import { Badge } from "./components/Badge";

export function ProductCard() {
  return (
    <div>
      <Badge kind="chef" /> {/* 👨‍🍳 Recomendado pelo Chef (ouro) */}
      <Badge kind="mais_pedido" /> {/* 🔥 Mais Pedido (vermelho) */}
      <Badge kind="novidade" /> {/* ✨ Novidade (turquesa) */}
      <Badge kind="veggie" /> {/* 🌱 Vegetariano (verde) */}
      <Badge kind="vegan" /> {/* 🥬 Vegano (verde escuro) */}
      <Badge kind="spicy" /> {/* 🌶️ Picante (laranja) */}
      <Badge kind="tripadvisor" /> {/* ⭐ TripAdvisor (emerald) */}
    </div>
  );
}
```

**Tipos de Badge**:
| Badge | Emoji | Cor | Significado |
|-------|-------|-----|-------------|
| chef | 👨‍🍳 | Ouro | Recomendação pessoal do chef |
| mais_pedido | 🔥 | Vermelho | Popular entre clientes |
| novidade | ✨ | Turquesa | Recém adicionado |
| veggie | 🌱 | Verde claro | Vegetariano |
| vegan | 🥬 | Verde escuro | Vegano |
| spicy | 🌶️ | Laranja | Picante |
| tripadvisor | ⭐ | Emerald | Bem classificado online |

---

## 📊 Exemplo Completo: MenuCatalogPageV2

```tsx
import { useState, useMemo } from "react";
import { MenuSearch, type MenuFilters } from "./components/MenuSearch";
import { MenuRecommendations } from "./components/MenuRecommendations";
import { MenuCategorySection } from "./components/MenuCategorySection";

export function MenuCatalogPageV2() {
  const [searchResults, setSearchResults] = useState<CatalogItem[]>([]);
  const [filters, setFilters] = useState<MenuFilters>({
    query: "",
    vegetarian: false,
    glutenFree: false,
    vegan: false,
    spicy: false,
  });

  const allItems = categories.flatMap((c) => c.items);

  // Se tem busca ativa, usa resultados de busca; senão, todos os itens
  const itemsToDisplay = filters.query.trim() ? searchResults : allItems;

  // Filtra categorias para só mostrar itens que passaram pelo filtro
  const displayCategories = useMemo(() => {
    if (!filters.query.trim()) return categories;

    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) =>
          searchResults.some((i) => i.id === item.id),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, filters.query, searchResults]);

  return (
    <div>
      {/* Hero (cardápio restaurante) */}
      <MenuHero restaurant={restaurant} />

      {/* Search bar - STICKY no topo */}
      <div className="sticky top-0 z-20 bg-white">
        <MenuSearch
          items={allItems}
          onSearch={setSearchResults}
          onFilterChange={setFilters}
        />
      </div>

      {/* Recomendações - SÓ quando NÃO está fazendo busca */}
      {!filters.query.trim() && <MenuRecommendations items={allItems} />}

      {/* Categorias com itens filtrados */}
      {itemsToDisplay.length === 0 ? (
        <div className="text-center py-12">
          <p>😢 Nenhum prato encontrado</p>
          <button onClick={() => setFilters(/* reset */)}>
            Limpar filtros
          </button>
        </div>
      ) : (
        displayCategories.map((category) => (
          <MenuCategorySection key={category.id} category={category} />
        ))
      )}
    </div>
  );
}
```

---

## 🎨 Design Tokens

```css
/* Cores de Badges */
--badge-chef-bg: #FEF3C7 (amber-100)
--badge-chef-text: #B45309 (amber-700)

--badge-popular-bg: #FEE2E2 (red-100)
--badge-popular-text: #DC2626 (red-700)

--badge-novo-bg: #CFFAFE (cyan-100)
--badge-novo-text: #0369A1 (cyan-700)

--badge-veggie-bg: #DCFCE7 (green-100)
--badge-veggie-text: #15803D (green-700)

--badge-vegan-bg: #BBF7D0 (green-200)
--badge-vegan-text: #166534 (green-800)

--badge-spicy-bg: #FED7AA (orange-100)
--badge-spicy-text: #B45309 (orange-700)

/* Search */
--search-bg: #F5F5F5
--search-border: #E5E7EB
--search-focus-ring: #22C55E

/* Filter Buttons */
--filter-active-bg: #22C55E
--filter-active-text: white
--filter-inactive-bg: #F3F4F6
--filter-inactive-text: #374151
```

---

## 📱 Mobile Optimi zations

### Touch Targets

- ✅ Mín. 44px botões (44×44px iOS, 48×48px Android)
- ✅ Filtros com 44px de altura
- ✅ Search input com 44px de altura
- ✅ Badge com padding confortável

### Performance

- ✅ MenuSearch debounce 300ms
- ✅ MenuRecommendations renderiza slice(0, 3) de cada tipo
- ✅ Lazy loading de imagens
- ✅ useMemo para categorias filtradas

---

## 🔄 Integração com Backend

### Para Busca Funcionar com Badges

```ts
// CatalogItem precisa ter:
interface CatalogItem {
  // ... campos existentes
  badges?: (
    | "chef"
    | "mais_pedido"
    | "novidade"
    | "veggie"
    | "vegan"
    | "spicy"
    | "tripadvisor"
  )[];
  isAvailable?: boolean;
  availabilityReason?: "out_of_stock" | "not_yet_available" | "sold_out";
  rating?: number; // 1-5 stars
  reviewCount?: number;
}
```

### FetchData Example

```ts
async function loadMenuItems(restaurantId: string) {
  const response = await fetch(`/api/restaurants/${restaurantId}/menu`);

  const items = await response.json();

  // Campos esperados:
  return items.map((item) => ({
    id: item.id,
    title: item.name,
    description: item.description,
    priceCents: item.price_cents,
    imageUrl: item.image_url,
    allergens: item.allergens || [],
    badges: item.badges || [], // ["chef", "mais_pedido", ...]
    isAvailable: item.is_available ?? true,
    availabilityReason: item.availability_reason,
    rating: item.rating, // 0-5
    reviewCount: item.review_count,
  }));
}
```

---

## ✅ Checklist de Implementação

- [ ] Atualizar CatalogItem type com novos campos
- [ ] Testar MenuSearch com diferentes queries
- [ ] Testar MenuRecommendations com diferentes badges
- [ ] Testar MenuAvailability com status indisponível
- [ ] Testar responsividade em mobile
- [ ] Adicionar dados mock com novos badges
- [ ] Testar performance em listas grandes (100+ itens)
- [ ] Adicionar testes unitários para MenuSearch
- [ ] Documentar novo flow para staff
- [ ] Deploy para staging

---

**Última atualização**: Fevereiro 2026
**Status**: 🟢 Pronto para Implementação
