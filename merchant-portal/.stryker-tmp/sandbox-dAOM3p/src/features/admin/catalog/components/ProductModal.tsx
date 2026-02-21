// @ts-nocheck
import { useEffect, useState } from "react";
import type { CatalogProduct, ProductCategory } from "../../../../core/catalog/catalogTypes";

interface ProductModalProps {
  open: boolean;
  initial?: CatalogProduct | null;
  categories: ProductCategory[];
  onClose: () => void;
  onSave: (
    input: Omit<CatalogProduct, "createdAt" | "updatedAt"> & { id?: string }
  ) => Promise<void>;
}

export function ProductModal({
  open,
  initial,
  categories,
  onClose,
  onSave,
}: ProductModalProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [priceEur, setPriceEur] = useState<string>("0");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setCategoryId(initial.categoryId ?? "");
      setPriceEur((initial.basePriceCents / 100).toFixed(2));
      setIsActive(initial.isActive);
    } else {
      setName("");
      setCategoryId(categories[0]?.id ?? "");
      setPriceEur("0");
      setIsActive(true);
    }
    setError(null);
    setSubmitting(false);
  }, [open, initial, categories]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cents = Math.round(Number(priceEur.replace(",", ".")) * 100);
    if (Number.isNaN(cents) || cents < 0) {
      setError("Preço deve ser um valor válido (ex.: 2.50).");
      return;
    }
    if (!name.trim()) {
      setError("O nome do produto é obrigatório.");
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        id: initial?.id,
        name: name.trim(),
        categoryId: categoryId || null,
        basePriceCents: cents,
        isActive,
        modifierGroupIds: initial?.modifierGroupIds ?? [],
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao guardar o produto."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4">
          <h2
            id="product-modal-title"
            className="text-lg font-semibold text-gray-900"
          >
            {initial ? "Editar produto" : "Novo produto"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label
              htmlFor="product-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nome
            </label>
            <input
              id="product-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="product-category"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Categoria
            </label>
            <select
              id="product-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="">— Sem categoria —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="product-price"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Preço base (€)
            </label>
            <input
              id="product-price"
              type="number"
              min={0}
              step={0.01}
              value={priceEur}
              onChange={(e) => setPriceEur(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              Ativo
            </label>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {submitting ? "A guardar…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
