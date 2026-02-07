import { useEffect, useMemo, useState } from "react";
import { useCatalogStore } from "../../../../core/catalog/catalogStore";
import { CatalogLayout } from "../components/CatalogLayout";

const SUPPORTED_LOCALES = ["es-ES", "en-GB", "pt-PT"];

export function TranslationsPage() {
  const { translations, loadAll } = useCatalogStore();
  const [locale, setLocale] = useState<string>("es-ES");

  useEffect(() => {
    loadAll().catch(() => {});
  }, [loadAll]);

  const filtered = useMemo(
    () => translations.filter((t) => t.locale === locale),
    [translations, locale],
  );

  return (
    <CatalogLayout
      title="Traduções"
      description="Traduza catálogos, produtos e modificadores por idioma. Preparado para integração futura com IA."
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Idioma:</span>
          <select
            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
          >
            {SUPPORTED_LOCALES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Sugerir tradução (stub)
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Tipo
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Campo
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">
                Valor traduzido
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2 text-gray-600">{t.entityType}</td>
                <td className="px-4 py-2 text-gray-600">{t.field}</td>
                <td className="px-4 py-2 text-gray-900">{t.value}</td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  Ainda não há traduções para este idioma.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </CatalogLayout>
  );
}
