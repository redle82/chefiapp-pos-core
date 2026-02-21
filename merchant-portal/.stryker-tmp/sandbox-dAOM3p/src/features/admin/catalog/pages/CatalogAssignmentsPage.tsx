// @ts-nocheck
import { useEffect } from "react";
import { useCatalogStore } from "../../../../core/catalog/catalogStore";
import { CatalogLayout } from "../components/CatalogLayout";

export function CatalogAssignmentsPage() {
  const { catalogs, assignments, loadAll, upsertAssignment } =
    useCatalogStore();

  useEffect(() => {
    loadAll().catch(() => {});
  }, [loadAll]);

  const handleQuickSeed = () => {
    if (!catalogs.length) return;
    void upsertAssignment({
      brandId: "default-brand",
      channel: "DELIVERY",
      platform: "UBER",
      catalogId: catalogs[0].id,
    });
  };

  return (
    <CatalogLayout
      title="Atribuir catálogos"
      description="Mapeia marca, canal e plataforma externa para um catálogo específico."
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Cada linha representa uma combinação única de marca, canal e
          plataforma.
        </p>
        <button
          type="button"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          onClick={handleQuickSeed}
        >
          Criar atribuição de exemplo
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Marca
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Canal
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Plataforma
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Catálogo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td className="px-4 py-2 text-gray-900">
                  {assignment.brandId}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {assignment.channel}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {assignment.platform ?? "—"}
                </td>
                <td className="px-4 py-2">
                  <select
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    value={assignment.catalogId ?? ""}
                    onChange={(e) =>
                      upsertAssignment({
                        ...assignment,
                        catalogId: e.target.value || null,
                      })
                    }
                  >
                    <option value="">Sem catálogo</option>
                    {catalogs.map((catalog) => (
                      <option key={catalog.id} value={catalog.id}>
                        {catalog.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {assignments.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  Ainda não há atribuições configuradas. Use o botão acima para
                  criar um exemplo rápido.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </CatalogLayout>
  );
}
