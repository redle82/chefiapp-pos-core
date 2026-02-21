// @ts-nocheck
import { useEffect, useState } from "react";
import { useCatalogStore } from "../../../../core/catalog/catalogStore";
import { CatalogLayout } from "../components/CatalogLayout";

type Tab = "groups" | "modifiers";

export function ModifiersPage() {
  const {
    modifierGroups,
    modifiers,
    loadAll,
    upsertModifierGroup,
    upsertModifier,
  } = useCatalogStore();
  const [activeTab, setActiveTab] = useState<Tab>("groups");

  useEffect(() => {
    loadAll().catch(() => {});
  }, [loadAll]);

  return (
    <CatalogLayout
      title="Modificadores"
      description="Configura grupos e opções adicionais que podem ser ligados aos produtos."
    >
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            activeTab === "groups"
              ? "bg-violet-100 text-violet-800"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab("groups")}
        >
          Grupos de modificadores
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            activeTab === "modifiers"
              ? "bg-violet-100 text-violet-800"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab("modifiers")}
        >
          Modificadores
        </button>
      </div>

      {activeTab === "groups" ? (
        <div className="space-y-4">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            onClick={() =>
              upsertModifierGroup({
                name: "Novo grupo",
                min: 0,
                max: 1,
              }).catch(() => {})
            }
          >
            Criar grupo
          </button>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Nome
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Min
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Max
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {modifierGroups.map((group) => (
                  <tr key={group.id}>
                    <td className="px-4 py-2 text-gray-900">{group.name}</td>
                    <td className="px-4 py-2 text-gray-600">{group.min}</td>
                    <td className="px-4 py-2 text-gray-600">{group.max}</td>
                  </tr>
                ))}
                {modifierGroups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      Nenhum grupo de modificadores criado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            onClick={() =>
              upsertModifier({
                name: "Novo modificador",
                groupId: modifierGroups[0]?.id ?? "",
                priceDeltaCents: 0,
                isActive: true,
              }).catch(() => {})
            }
          >
            Criar modificador
          </button>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Nome
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Grupo
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Delta de preço
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {modifiers.map((modifier) => {
                  const group = modifierGroups.find(
                    (g) => g.id === modifier.groupId,
                  );
                  return (
                    <tr key={modifier.id}>
                      <td className="px-4 py-2 text-gray-900">
                        {modifier.name}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {group?.name ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {(modifier.priceDeltaCents / 100).toFixed(2)} €
                      </td>
                    </tr>
                  );
                })}
                {modifiers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      Nenhum modificador criado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </CatalogLayout>
  );
}
