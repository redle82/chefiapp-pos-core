// @ts-nocheck
import { useEffect } from "react";
import { useCatalogStore } from "../../../../core/catalog/catalogStore";
import { useCurrency } from "../../../../core/currency/useCurrency";
import { CatalogLayout } from "../components/CatalogLayout";

export function CombosPage() {
  const { combos, loadAll, toggleComboActive, upsertCombo } = useCatalogStore();
  const { formatAmount } = useCurrency();

  useEffect(() => {
    loadAll().catch(() => {});
  }, [loadAll]);

  const handleCreateCombo = () => {
    upsertCombo({
      name: "Novo combo",
      priceCents: 0,
      items: [],
      isActive: true,
    }).then(() => loadAll().catch(() => {}));
  };

  return (
    <CatalogLayout
      title="Combos"
      description="Cria combinações de produtos com preço fixo para aumentar o ticket médio."
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Cada combo referencia produtos e modificadores existentes.
        </p>
        <button
          type="button"
          onClick={handleCreateCombo}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        >
          Criar combo
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Nome
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Preço
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Itens
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Ativo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {combos.map((combo) => (
              <tr key={combo.id}>
                <td className="px-4 py-2 text-gray-900">{combo.name}</td>
                <td className="px-4 py-2 text-gray-600">
                  {formatAmount(combo.priceCents)}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {combo.items.length} itens
                </td>
                <td className="px-4 py-2">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={combo.isActive}
                      onChange={(e) =>
                        toggleComboActive(combo.id, e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-xs text-gray-600">Ativo</span>
                  </label>
                </td>
              </tr>
            ))}
            {combos.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  Nenhum combo criado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </CatalogLayout>
  );
}
