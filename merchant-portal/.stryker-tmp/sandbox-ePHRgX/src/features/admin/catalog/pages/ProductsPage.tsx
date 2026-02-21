// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import type { CatalogProduct } from "../../../../core/catalog/catalogTypes";
import { useCatalogStore } from "../../../../core/catalog/catalogStore";
import { useCurrency } from "../../../../core/currency/useCurrency";
import { CatalogLayout } from "../components/CatalogLayout";
import { ProductModal } from "../components/ProductModal";

export function ProductsPage() {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;
  const {
    products,
    categories,
    loadAll,
    toggleProductActive,
    upsertProduct,
    reloadProducts,
  } = useCatalogStore();
  const { formatAmount } = useCurrency();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    loadAll(restaurantId).catch(() => {});
  }, [loadAll, restaurantId]);

  const categoryById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (categoryById.get(p.categoryId ?? "") ?? "").toLowerCase().includes(q),
    );
  }, [products, query, categoryById]);

  return (
    <CatalogLayout
      title="Produtos"
      description="Gestão massiva de produtos com preços, categorias e estado."
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          type="search"
          placeholder="Filtrar por nome ou categoria"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        >
          Criar produto
        </button>
      </div>

      <ProductModal
        open={modalOpen}
        initial={editing}
        categories={categories}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={async (input) => {
          await upsertProduct(input, restaurantId);
          await reloadProducts(restaurantId);
        }}
      />

      <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Nome
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Categoria
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Preço base
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Ativo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-900">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(product);
                      setModalOpen(true);
                    }}
                    className="text-left font-medium text-violet-600 hover:underline focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 rounded"
                  >
                    {product.name}
                  </button>
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {product.categoryId
                    ? categoryById.get(product.categoryId) ?? "—"
                    : "—"}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {formatAmount(product.basePriceCents)}
                </td>
                <td className="px-4 py-2">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={product.isActive}
                      onChange={(e) =>
                        toggleProductActive(
                          product.id,
                          e.target.checked,
                          restaurantId,
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-xs text-gray-600">Ativo</span>
                  </label>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </CatalogLayout>
  );
}
