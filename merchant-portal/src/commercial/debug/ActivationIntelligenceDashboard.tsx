/**
 * Activation Intelligence Dashboard — /debug/activation
 *
 * Phase 2.6 — Board-ready metrics:
 *   • Activation score (1–5) por restaurante
 *   • Time to first order
 *   • Dropoff por etapa
 *   • Activation rate, velocity
 *
 * Reads from commercialTracking buffer (localStorage).
 */

import { useCallback, useEffect, useState } from "react";
import { commercialTracking } from "../tracking";
import { isCommercialTrackingEnabled } from "../tracking/flag";
import {
  computeActivationIntelligence,
  type ActivationIntelligenceMetrics,
} from "../activation/activationIntelligence";
import type { CommercialEvent } from "../tracking/types";

function MetricCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? "border-amber-500/50 bg-amber-500/10"
          : "border-gray-700 bg-gray-800/50"
      }`}
    >
      <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
      <div className="mt-1 font-mono text-xl font-bold text-white">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

export function ActivationIntelligenceDashboard() {
  const enabled = isCommercialTrackingEnabled();
  const [metrics, setMetrics] = useState<ActivationIntelligenceMetrics | null>(
    null,
  );
  const [eventCount, setEventCount] = useState(0);

  const refresh = useCallback(() => {
    const events = commercialTracking.getBuffer() as CommercialEvent[];
    setEventCount(events.length);
    setMetrics(computeActivationIntelligence(events));
  }, []);

  useEffect(() => {
    refresh();
    const unsub = commercialTracking.subscribe(() => refresh());
    return unsub;
  }, [refresh]);

  const downloadJson = useCallback(() => {
    if (!metrics) return;
    const blob = new Blob([JSON.stringify(metrics, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `activation-metrics-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [metrics]);

  const toPct = (v: number) => `${(v * 100).toFixed(1)}%`;

  if (!enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-400">
        <div className="text-center">
          <p className="font-semibold">Commercial Tracking Disabled</p>
          <p className="text-sm">
            Enable VITE_COMMERCIAL_TRACKING_ENABLED or run in dev mode.
          </p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  const { funnel, activationScores, aggregates } = metrics;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          Activation Intelligence
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-emerald-800/50 text-emerald-300 px-2 py-1 rounded">
            {eventCount} events
          </span>
          <button
            onClick={refresh}
            className="text-xs px-3 py-1.5 rounded border border-gray-600 hover:border-gray-500"
          >
            Refresh
          </button>
          <button
            onClick={downloadJson}
            className="text-xs px-3 py-1.5 rounded bg-amber-600/30 text-amber-300 hover:bg-amber-600/50"
          >
            Download JSON
          </button>
          <a
            href="/debug/commercial"
            className="text-xs text-gray-400 hover:text-white"
          >
            ← Commercial Debug
          </a>
        </div>
      </div>

      {/* Core metrics */}
      <section>
        <h2 className="text-lg font-semibold text-gray-300 mb-4">
          Core metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <MetricCard
            label="Activation rate"
            value={toPct(aggregates.activationRate)}
            sub="first_order / trial_start"
            highlight
          />
          <MetricCard
            label="Trial conversion"
            value={toPct(aggregates.trialConversionRate)}
            sub="first_payment / trial_start"
          />
          <MetricCard
            label="Time to first order (h)"
            value={aggregates.timeToFirstOrderHoursMedian}
            sub="median"
            highlight
          />
          <MetricCard
            label="Avg activation score"
            value={aggregates.avgActivationScore}
            sub={`max 15 (norm 0–5)`}
          />
          <MetricCard
            label="Fully activated"
            value={aggregates.fullyActivatedCount}
            sub={`of ${funnel.trialStarts} trials`}
          />
          <MetricCard
            label="Trial starts"
            value={funnel.trialStarts}
            sub="unique restaurants"
          />
        </div>
      </section>

      {/* Dropoff by step */}
      <section>
        <h2 className="text-lg font-semibold text-gray-300 mb-4">
          Dropoff por etapa
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Trial → Menu"
            value={aggregates.dropoffByStep.noMenu}
            sub="não criaram menu"
          />
          <MetricCard
            label="Menu → Shift"
            value={aggregates.dropoffByStep.noShift}
            sub="não abriram caixa"
          />
          <MetricCard
            label="Shift → Order"
            value={aggregates.dropoffByStep.noOrder}
            sub="não criaram pedido"
          />
          <MetricCard
            label="Order → Payment"
            value={aggregates.dropoffByStep.noPayment}
            sub="não receberam pagamento"
          />
        </div>
      </section>

      {/* Activation scores by restaurant */}
      <section>
        <h2 className="text-lg font-semibold text-gray-300 mb-4">
          Activation score por restaurante (top 20)
        </h2>
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/80">
                <th className="text-left p-3 text-gray-400">Restaurant ID</th>
                <th className="text-right p-3 text-gray-400">Score</th>
                <th className="text-right p-3 text-gray-400">Norm (0–5)</th>
                <th className="text-left p-3 text-gray-400">Milestones</th>
              </tr>
            </thead>
            <tbody>
              {activationScores.slice(0, 20).map((s) => (
                <tr
                  key={s.restaurantId}
                  className="border-b border-gray-800 hover:bg-gray-800/50"
                >
                  <td className="p-3 font-mono text-xs text-gray-300">
                    {s.restaurantId.slice(0, 8)}…
                  </td>
                  <td className="p-3 text-right font-mono text-white">
                    {s.score}/{s.maxScore}
                  </td>
                  <td className="p-3 text-right font-mono text-amber-400">
                    {s.scoreNormalized}
                  </td>
                  <td className="p-3 text-xs text-gray-500">
                    {Object.entries(s.milestones)
                      .filter(([, v]) => v)
                      .map(([k]) => k.replace(/_/g, " "))
                      .join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {activationScores.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Sem eventos de activation no buffer.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
