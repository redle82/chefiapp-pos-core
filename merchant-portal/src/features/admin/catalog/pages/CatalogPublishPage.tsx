import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import {
  compareLatestPublicationDiff,
  listPublicationPreviews,
  listPublicationRecords,
  publishCatalogTarget,
  rollbackPublicationTarget,
  schedulePublicationTarget,
} from "../../../../core/catalog/catalogApi";
import type {
  PublicationPreview,
  PublicationRecord,
  PublicationTarget,
} from "../../../../core/catalog/catalogTypes";
import { CatalogLayout } from "../components/CatalogLayout";

export function CatalogPublishPage() {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime.restaurant_id ?? null;

  const [previews, setPreviews] = useState<PublicationPreview[]>([]);
  const [records, setRecords] = useState<PublicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refreshRecords = async () => {
    const history = await listPublicationRecords(restaurantId);
    setRecords(history.slice(0, 8));
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listPublicationPreviews(restaurantId);
        if (!active) return;
        setPreviews(data);

        const history = await listPublicationRecords(restaurantId);
        if (!active) return;
        setRecords(history.slice(0, 8));
      } catch (e) {
        if (!active) return;
        const message =
          e instanceof Error ? e.message : "Erro ao gerar preview";
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [restaurantId]);

  const handlePublish = async (target: PublicationTarget) => {
    try {
      const record = await publishCatalogTarget(target, restaurantId);
      await refreshRecords();
      setStatusMessage(
        `Publicacao ${target} concluida (${record.versionTag}).`,
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha ao publicar";
      setStatusMessage(`Erro: ${message}`);
    }
  };

  const handleRollback = async (target: PublicationTarget) => {
    try {
      const record = await rollbackPublicationTarget(target, restaurantId);
      await refreshRecords();
      setStatusMessage(`Rollback ${target} concluido (${record.versionTag}).`);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Falha ao efetuar rollback";
      setStatusMessage(`Erro: ${message}`);
    }
  };

  const handleSchedule = async (target: PublicationTarget) => {
    try {
      const record = await schedulePublicationTarget(
        target,
        new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        restaurantId,
      );
      await refreshRecords();
      setStatusMessage(`Agendamento ${target} criado (${record.versionTag}).`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha ao agendar";
      setStatusMessage(`Erro: ${message}`);
    }
  };

  const handleCompare = async (target: PublicationTarget) => {
    try {
      const diff = await compareLatestPublicationDiff(target, restaurantId);
      if (!diff) {
        setStatusMessage(
          `Diff ${target}: historico insuficiente para comparar.`,
        );
        return;
      }
      setStatusMessage(
        `Diff ${target}: ${diff.changedItems} itens alterados (${diff.previousVersionTag} -> ${diff.latestVersionTag}).`,
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha ao comparar";
      setStatusMessage(`Erro: ${message}`);
    }
  };

  return (
    <CatalogLayout
      title="Publicação"
      description="Controla como o menu é publicado por canal, com consistência operacional e comercial."
    >
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-gray-600">Gerando previews...</p>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {!loading && !error ? (
          <div className="grid gap-2 md:grid-cols-3">
            {previews.map((preview) => (
              <div
                key={preview.target}
                className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700"
              >
                <div className="font-semibold text-gray-900">
                  {preview.target}
                </div>
                <div className="mt-1">{preview.totalItems} itens</div>
                <div>{preview.activeItems} ativos</div>
                <div>{preview.warnings} alertas</div>

                <button
                  type="button"
                  className="mt-2 rounded bg-violet-600 px-2 py-1 text-xs font-semibold text-white"
                  onClick={() => handlePublish(preview.target)}
                >
                  Publicar {preview.target}
                </button>
                <button
                  type="button"
                  className="ml-2 mt-2 rounded border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700"
                  onClick={() => handleRollback(preview.target)}
                >
                  Rollback {preview.target}
                </button>
                <button
                  type="button"
                  className="ml-2 mt-2 rounded border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700"
                  onClick={() => handleSchedule(preview.target)}
                >
                  Agendar {preview.target}
                </button>
                <button
                  type="button"
                  className="ml-2 mt-2 rounded border border-indigo-300 px-2 py-1 text-xs font-semibold text-indigo-700"
                  onClick={() => handleCompare(preview.target)}
                >
                  Comparar {preview.target}
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {statusMessage ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            {statusMessage}
          </div>
        ) : null}

        {records.length > 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Historico recente
            </h2>
            <ul className="mt-2 space-y-1 text-xs text-gray-700">
              {records.map((record) => (
                <li key={record.id}>
                  {record.target} · {record.status} · {record.versionTag}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </CatalogLayout>
  );
}
