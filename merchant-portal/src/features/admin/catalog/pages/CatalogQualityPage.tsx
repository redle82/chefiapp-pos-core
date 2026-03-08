import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { listQualityIssues } from "../../../../core/catalog/catalogApi";
import type { QualityIssue } from "../../../../core/catalog/catalogTypes";
import { CatalogLayout } from "../components/CatalogLayout";

export function CatalogQualityPage() {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime.restaurant_id ?? null;

  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listQualityIssues(restaurantId);
        if (!active) return;
        setIssues(data);
      } catch (e) {
        if (!active) return;
        const message =
          e instanceof Error ? e.message : "Erro ao carregar diagnostico";
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [restaurantId]);

  return (
    <CatalogLayout
      title="Qualidade e diagnóstico"
      description="Valida consistência do menu antes da publicação para reduzir falhas operacionais."
    >
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-600">Gerando diagnostico...</p>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {!loading && !error ? (
          <>
            <p className="text-sm text-gray-700">
              {issues.length} alertas identificados
            </p>
            <ul className="grid gap-2 md:grid-cols-2">
              {issues.map((issue) => (
                <li
                  key={issue.id}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <div className="font-medium text-gray-900">
                    {issue.message}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                    {issue.ruleCode} · {issue.severity}
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </CatalogLayout>
  );
}
