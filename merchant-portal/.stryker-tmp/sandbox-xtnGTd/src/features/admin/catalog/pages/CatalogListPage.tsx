import { useEffect, useMemo, useState } from "react";
import { useCatalogStore } from "../../../../core/catalog/catalogStore";
import { CatalogLayout } from "../components/CatalogLayout";

export function CatalogListPage() {
  const { catalogs, loadAll, setCatalogActive, duplicateCatalog } =
    useCatalogStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadAll().catch(() => {
      // erros já são tratados pela store
    });
  }, [loadAll]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalogs;
    return catalogs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.brandId ?? "").toLowerCase().includes(q),
    );
  }, [catalogs, query]);

  return (
    <CatalogLayout
      title="Lista de catálogos"
      description="Gira e organiza catálogos por marca, canal e integrações externas."
    >
      <div className="flex items-center justify-between mb-4 gap-3">
        <input
          type="search"
          placeholder="Que catálogo estás a procurar?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          type="button"
          className="inline-flex items-center rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
          onClick={() => {
            duplicateCatalog(filtered[0]?.id ?? "").catch(() => {});
          }}
        >
          Criar catálogo
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Nome do catálogo
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Marca
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Destinos
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Estado
              </th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.map((catalog) => (
              <tr key={catalog.id}>
                <td className="px-4 py-2 text-gray-900">{catalog.name}</td>
                <td className="px-4 py-2 text-gray-600">
                  {catalog.brandId ?? "—"}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {catalog.destinations.join(", ")}
                </td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      catalog.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-500"
                    }`}
                    onClick={() =>
                      setCatalogActive(catalog.id, !catalog.isActive)
                    }
                  >
                    {catalog.isActive ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="px-4 py-2 text-right space-x-2">
                  <button
                    type="button"
                    className="text-xs font-medium text-violet-700 hover:text-violet-900"
                    onClick={() => {
                      duplicateCatalog(catalog.id).catch(() => {});
                    }}
                  >
                    Duplicar
                  </button>
                  {/* Placeholder para edição futura */}
                  <button
                    type="button"
                    className="text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  Nenhum catálogo encontrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </CatalogLayout>
  );
}
