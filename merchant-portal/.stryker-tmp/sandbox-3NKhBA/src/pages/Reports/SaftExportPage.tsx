/**
 * SaftExportPage — Exportar SAF-T XML por período.
 * Relatórios > Exportar SAF-T: from/to + Descarregar ficheiro XML.
 */
// @ts-nocheck


import { useState } from "react";
import { useRestaurantId } from "../../ui/hooks/useRestaurantId";
import { exportSaftXml } from "../../core/fiscal/SaftExportService";

export function SaftExportPage() {
  const { restaurantId } = useRestaurantId();
  const [from, setFrom] = useState(() =>
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [to, setTo] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!restaurantId) {
      setError("Nenhum restaurante selecionado.");
      return;
    }
    if (!from || !to) {
      setError("Indique as datas de início e fim.");
      return;
    }
    if (from > to) {
      setError("A data de início deve ser anterior à data de fim.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { xml, error: err } = await exportSaftXml({
        restaurantId,
        from,
        to,
      });
      if (err) {
        setError(err);
        return;
      }
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SAFT-${from}-${to}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || "Erro ao exportar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-white mb-2">
        Exportar SAF-T (XML)
      </h1>
      <p className="text-neutral-400 text-sm mb-6">
        Gera um ficheiro SAF-T para o período indicado, com base nos pedidos
        registados. Utilize para entrega à AT ou contabilidade.
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm text-neutral-300 mb-1">
            Data de início
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 text-white px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-300 mb-1">
            Data de fim
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 text-white px-3 py-2"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="rounded-lg bg-amber-500 text-black font-medium px-4 py-2 hover:bg-amber-400 disabled:opacity-50"
      >
        {loading ? "A gerar…" : "Descarregar SAF-T (XML)"}
      </button>
    </div>
  );
}
