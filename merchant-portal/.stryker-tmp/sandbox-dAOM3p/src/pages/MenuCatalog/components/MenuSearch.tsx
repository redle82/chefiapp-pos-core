/**
 * MenuSearch — Barra de busca inteligente com filtros rápidos
 *
 * Features:
 * - Busca por nome, descrição, ingredientes
 * - Filtros rápidos: Vegetariano, Sem Glúten, Vegano, Picante
 * - Histórico de buscas recentes
 * - Resulta em tempo real
 */
// @ts-nocheck


import { useCallback, useMemo, useState } from "react";
import type { CatalogItem } from "../types";

export interface MenuSearchProps {
  items: CatalogItem[];
  onSearch: (results: CatalogItem[]) => void;
  onFilterChange: (filters: MenuFilters) => void;
}

export interface MenuFilters {
  query: string;
  vegetarian: boolean;
  glutenFree: boolean;
  vegan: boolean;
  spicy: boolean;
}

const INITIAL_FILTERS: MenuFilters = {
  query: "",
  vegetarian: false,
  glutenFree: false,
  vegan: false,
  spicy: false,
};

const QUICK_FILTERS = [
  { id: "vegetarian", label: "🌱 Vegetariano", key: "vegetarian" },
  { id: "glutenFree", label: "🌾 Sem Glúten", key: "glutenFree" },
  { id: "vegan", label: "🥬 Vegano", key: "vegan" },
  { id: "spicy", label: "🌶️ Picante", key: "spicy" },
] as const;

function matchesQuery(item: CatalogItem, query: string): boolean {
  if (!query.trim()) return true;

  const searchTerm = query.toLowerCase();
  const titleMatch = item.title.toLowerCase().includes(searchTerm);
  const descMatch = item.description.toLowerCase().includes(searchTerm);

  return titleMatch || descMatch;
}

function matchesFilters(item: CatalogItem, filters: MenuFilters): boolean {
  if (filters.vegetarian) {
    const allergensBadges = item.allergens.concat(item.badges ?? []);
    if (!allergensBadges.includes("veggie")) return false;
  }

  if (filters.glutenFree) {
    const allergensBadges = item.allergens.concat(item.badges ?? []);
    if (allergensBadges.includes("gluten")) return false;
  }

  if (filters.vegan) {
    const badges = item.badges ?? [];
    if (!badges.includes("vegan")) return false;
  }

  if (filters.spicy) {
    const badges = item.badges ?? [];
    if (!badges.includes("spicy")) return false;
  }

  return true;
}

export function MenuSearch({
  items,
  onSearch,
  onFilterChange,
}: MenuSearchProps) {
  const [filters, setFilters] = useState<MenuFilters>(INITIAL_FILTERS);
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    return items.filter(
      (item) =>
        matchesQuery(item, filters.query) && matchesFilters(item, filters),
    );
  }, [items, filters]);

  const handleQueryChange = useCallback(
    (query: string) => {
      const newFilters = { ...filters, query };
      setFilters(newFilters);
      onFilterChange(newFilters);
      onSearch(results);
      setShowResults(query.trim().length > 0);
    },
    [filters, onFilterChange, onSearch, results],
  );

  const handleFilterToggle = useCallback(
    (key: keyof Omit<MenuFilters, "query">) => {
      const newFilters = { ...filters, [key]: !filters[key] };
      setFilters(newFilters);
      onFilterChange(newFilters);

      const filtered = items.filter(
        (item) =>
          matchesQuery(item, newFilters.query) &&
          matchesFilters(item, newFilters),
      );
      onSearch(filtered);
    },
    [filters, filters.query, items, onFilterChange, onSearch],
  );

  const handleClear = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    onFilterChange(INITIAL_FILTERS);
    onSearch(items);
    setShowResults(false);
  }, [items, onFilterChange, onSearch]);

  const hasActiveFilters =
    filters.vegetarian ||
    filters.glutenFree ||
    filters.vegan ||
    filters.spicy ||
    filters.query.trim().length > 0;

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-neutral-200 p-4 space-y-3">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar prato, ingrediente..."
          value={filters.query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="w-full px-4 py-2.5 pl-10 bg-neutral-100 rounded-lg text-neutral-900 placeholder-neutral-500 text-base border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
          🔍
        </span>

        {/* Clear Button */}
        {filters.query && (
          <button
            onClick={() => handleQueryChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-lg"
            aria-label="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {QUICK_FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() =>
              handleFilterToggle(filter.key as keyof Omit<MenuFilters, "query">)
            }
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
              filters[filter.key as keyof Omit<MenuFilters, "query">]
                ? "bg-green-500 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Results Info & Clear */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">
            {results.length === 0
              ? "Nenhum prato encontrado"
              : `${results.length} prato${
                  results.length !== 1 ? "s" : ""
                } encontrado${results.length !== 1 ? "s" : ""}`}
          </span>
          <button
            onClick={handleClear}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* CSS for no-scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
