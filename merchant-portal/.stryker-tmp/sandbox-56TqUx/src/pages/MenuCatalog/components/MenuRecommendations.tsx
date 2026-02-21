/**
 * MenuRecommendations — Seção de recomendações contextuais
 *
 * Exibe:
 * - Recomendações do Chef (badge "chef")
 * - Mais Pedidos (badge "mais_pedido")
 * - Novidades (badge "novidade")
 * - Populares na comunidade/social proof
 */
// @ts-nocheck


import type { CatalogItem } from "../types";
import { MenuDishCard } from "./MenuDishCard";

export interface MenuRecommendationsProps {
  items: CatalogItem[];
  onVerPrato: (item: CatalogItem) => void;
  onPedir?: (item: CatalogItem) => void;
  usePremium?: boolean;
}

export function MenuRecommendations({
  items,
  onVerPrato,
  onPedir,
  usePremium = true,
}: MenuRecommendationsProps) {
  // Agrupar por tipo de recomendação
  const chefPicks = items.filter((item) =>
    (item.badges ?? []).includes("chef"),
  );

  const mostOrdered = items.filter((item) =>
    (item.badges ?? []).includes("mais_pedido"),
  );

  const newItems = items.filter((item) =>
    (item.badges ?? []).includes("novidade"),
  );

  // Popular: combina chef + mais_pedido (social proof)
  const popular = items.filter(
    (item) =>
      (item.badges ?? []).some((b) => ["chef", "mais_pedido"].includes(b)) ||
      (item.badges ?? []).includes("tripadvisor"),
  );

  // Se não houver recomendações, não renderizar
  if (
    chefPicks.length === 0 &&
    mostOrdered.length === 0 &&
    newItems.length === 0
  ) {
    return null;
  }

  return (
    <section className="bg-neutral-50 py-8 space-y-8">
      {/* Chef Picks */}
      {chefPicks.length > 0 && (
        <div className="px-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">👨‍🍳</span>
            <h2 className="text-xl font-bold text-neutral-900">
              Recomendações do Chef
            </h2>
            <span className="ml-auto text-sm text-neutral-500">
              {chefPicks.length} prato{chefPicks.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chefPicks.slice(0, 3).map((item) => (
              <MenuDishCard
                key={item.id}
                item={item}
                onVerPrato={onVerPrato}
                onPedir={onPedir}
                usePremium={usePremium}
              />
            ))}
          </div>
        </div>
      )}

      {/* Most Ordered */}
      {mostOrdered.length > 0 && (
        <div className="px-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <h2 className="text-xl font-bold text-neutral-900">Mais Pedidos</h2>
            <span className="ml-auto text-sm text-neutral-500">
              {mostOrdered.length} prato{mostOrdered.length > 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-sm text-neutral-600 mb-4">
            O que a galera mais pede aqui 🎯
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mostOrdered.slice(0, 3).map((item) => (
              <MenuDishCard
                key={item.id}
                item={item}
                onVerPrato={onVerPrato}
                onPedir={onPedir}
                usePremium={usePremium}
              />
            ))}
          </div>
        </div>
      )}

      {/* New Items */}
      {newItems.length > 0 && (
        <div className="px-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h2 className="text-xl font-bold text-neutral-900">Novidades</h2>
            <span className="ml-auto text-sm text-neutral-500">
              {newItems.length} prato{newItems.length > 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-sm text-neutral-600 mb-4">
            Recém adicionados ao cardápio 🆕
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newItems.slice(0, 3).map((item) => (
              <MenuDishCard
                key={item.id}
                item={item}
                onVerPrato={onVerPrato}
                onPedir={onPedir}
                usePremium={usePremium}
              />
            ))}
          </div>
        </div>
      )}

      {/* Social Proof / Popular */}
      {popular.length > 4 && (
        <div className="px-4 pt-4 border-t border-neutral-200">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <h2 className="text-lg font-bold text-neutral-900">Popular</h2>
            <span className="ml-auto text-xs text-neutral-500 font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Topo do mês
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popular.slice(0, 3).map((item) => (
              <MenuDishCard
                key={item.id}
                item={item}
                onVerPrato={onVerPrato}
                onPedir={onPedir}
                usePremium={usePremium}
              />
            ))}
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="px-4 pt-4 text-center">
        <p className="text-sm text-neutral-600">
          💡 Dica: Use a barra de busca para encontrar pratos específicos
        </p>
      </div>
    </section>
  );
}
