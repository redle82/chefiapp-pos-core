/**
 * CommercialDebugPage — /debug/commercial
 *
 * Internal-only page that shows:
 *   • Current country / segment / device / landing_version
 *   • Live stream of commercial events (via subscription)
 *   • Full event buffer from localStorage
 *   • Lead payloads captured during session
 *   • Quick-fire test buttons to simulate events
 *
 * Protected: only renders when commercial_tracking is enabled
 * (always true in dev; env var in prod).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import type { CountryCode } from "../../landings/countries";
import type { Segment } from "../../landings/countryCopy";
import {
  clearBufferedLeads,
  commercialTracking,
  computeActivationIntelligenceInsights,
  computeActivationRecommendedActions,
  detectDevice,
  getBufferedLeads,
  getLeadScore,
  isCommercialTrackingEnabled,
  isLeadHot,
  resetLeadScore,
  type CommercialEvent,
} from "../tracking";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COUNTRIES: CountryCode[] = ["br", "es", "gb", "us"];
const SEGMENTS: Segment[] = ["small", "multi", "enterprise"];

function resolveLandingVersion(pathname: string): string {
  if (/^\/(br|es|gb|us)\/?$/.test(pathname)) return "country-v1";
  if (pathname.startsWith("/landing")) return "landing-v2";
  return "debug";
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function CommercialDebugPage() {
  const enabled = isCommercialTrackingEnabled();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const device = useMemo(() => detectDevice(), []);

  // State
  const [liveEvents, setLiveEvents] = useState<CommercialEvent[]>([]);
  const [buffer, setBuffer] = useState<CommercialEvent[]>([]);
  const [leads, setLeads] = useState(getBufferedLeads());

  // Selected country/segment for testing
  const country = (searchParams.get("country") as CountryCode) ?? "es";
  const segment = (searchParams.get("segment") as Segment) ?? "small";
  const landing_version = resolveLandingVersion(pathname);

  // Refresh buffer/leads
  const refresh = useCallback(() => {
    setBuffer(commercialTracking.getBuffer());
    setLeads(getBufferedLeads());
  }, []);

  // Subscribe to live events
  useEffect(() => {
    const unsub = commercialTracking.subscribe((evt) => {
      setLiveEvents((prev) => [...prev, evt]);
    });
    // Initial load
    refresh();
    return unsub;
  }, [refresh]);

  // Setters
  const setCountry = useCallback(
    (c: CountryCode) => {
      setSearchParams((p) => {
        const n = new URLSearchParams(p);
        n.set("country", c);
        return n;
      });
    },
    [setSearchParams],
  );

  const setSegment = useCallback(
    (s: Segment) => {
      setSearchParams((p) => {
        const n = new URLSearchParams(p);
        n.set("segment", s);
        return n;
      });
    },
    [setSearchParams],
  );

  // Fire test events
  const base = useCallback(
    () => ({
      timestamp: new Date().toISOString(),
      country,
      segment,
      landing_version,
      device,
      path: pathname,
    }),
    [country, segment, landing_version, device, pathname],
  );

  const firePageView = useCallback(() => {
    commercialTracking.track({ ...base(), event: "page_view" });
    refresh();
  }, [base, refresh]);

  const fireWhatsApp = useCallback(() => {
    commercialTracking.track({
      ...base(),
      event: "cta_whatsapp_click",
      placement: "debug-hero",
    });
    refresh();
  }, [base, refresh]);

  const fireDemo = useCallback(() => {
    commercialTracking.track({ ...base(), event: "cta_demo_click" });
    refresh();
  }, [base, refresh]);

  const firePricing = useCallback(() => {
    commercialTracking.track({
      ...base(),
      event: "pricing_view",
      plan: "starter",
    });
    refresh();
  }, [base, refresh]);

  const clearAll = useCallback(() => {
    commercialTracking.clearBuffer();
    clearBufferedLeads();
    resetLeadScore();
    setLiveEvents([]);
    refresh();
  }, [refresh]);

  const leadScore = getLeadScore();
  const leadHot = isLeadHot();
  const funnel = commercialTracking.getFunnelMetrics();
  const segmentation = commercialTracking.getFunnelSegmentation();
  const activationInsights = computeActivationIntelligenceInsights(buffer);
  const recommendedActions = computeActivationRecommendedActions({
    insights: activationInsights,
    metrics: funnel,
  });

  const toPct = (value: number) => `${(value * 100).toFixed(1)}%`;

  const downloadSnapshot = useCallback(() => {
    const csv = commercialTracking.getFunnelSnapshotCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `commercial-funnel-snapshot-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (!enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Commercial Tracking Disabled</p>
          <p className="text-sm">
            Set{" "}
            <code className="text-amber-400">
              VITE_COMMERCIAL_TRACKING_ENABLED=true
            </code>{" "}
            or run in dev mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          🛰️ Commercial Debug Console
        </h1>
        <div className="flex items-center gap-3">
          <a
            href="/debug/activation"
            className="text-xs text-amber-400 hover:text-amber-300"
          >
            Activation Intelligence →
          </a>
          <span className="text-xs bg-emerald-800 text-emerald-200 px-2 py-1 rounded">
            tracking: ON
          </span>
        </div>
      </div>

      {/* Lead Score */}
      <section className="bg-gray-900 rounded-xl p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-300">Lead Scoring</h2>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-500">Score: </span>
            <span className="font-mono font-bold text-emerald-400">
              {leadScore}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Status: </span>
            <span
              className={`font-semibold ${
                leadHot ? "text-amber-400" : "text-gray-400"
              }`}
            >
              {leadHot ? "HOT" : "warm"}
            </span>
          </div>
        </div>
      </section>

      {/* Funnel baseline */}
      <section className="bg-gray-900 rounded-xl p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-300">
          Sales Funnel Baseline
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Page Views</span>
            <div className="font-mono font-bold text-white">
              {funnel.pageViews}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Pricing Views</span>
            <div className="font-mono font-bold text-white">
              {funnel.pricingViews}
            </div>
          </div>
          <div>
            <span className="text-gray-500">CTA Clicks</span>
            <div className="font-mono font-bold text-white">
              {funnel.ctaClicks}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Lead Submits</span>
            <div className="font-mono font-bold text-white">
              {funnel.leadSubmits}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Trial Starts</span>
            <div className="font-mono font-bold text-white">
              {funnel.trialStarts}
            </div>
          </div>
          <div>
            <span className="text-gray-500">First Orders</span>
            <div className="font-mono font-bold text-white">
              {funnel.firstOrders}
            </div>
          </div>
          <div>
            <span className="text-gray-500">First Payments</span>
            <div className="font-mono font-bold text-white">
              {funnel.firstPayments}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Buffered Events</span>
            <div className="font-mono font-bold text-emerald-400">
              {funnel.totalEvents}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-gray-800 border border-gray-700 rounded p-2">
            <div className="text-gray-500">pricing / page</div>
            <div className="font-mono text-amber-400">
              {toPct(funnel.rates.pricingFromPage)}
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded p-2">
            <div className="text-gray-500">cta / pricing</div>
            <div className="font-mono text-amber-400">
              {toPct(funnel.rates.ctaFromPricing)}
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded p-2">
            <div className="text-gray-500">lead / cta</div>
            <div className="font-mono text-amber-400">
              {toPct(funnel.rates.leadFromCta)}
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded p-2">
            <div className="text-gray-500">lead / page</div>
            <div className="font-mono text-amber-400">
              {toPct(funnel.rates.leadFromPage)}
            </div>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">
            Activation Intelligence
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
            <div className="bg-gray-800 border border-gray-700 rounded p-2">
              <div className="text-gray-500">Activation Rate</div>
              <div className="font-mono text-emerald-400">
                {toPct(funnel.activation.activationRate)}
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded p-2">
              <div className="text-gray-500">Trial Conversion</div>
              <div className="font-mono text-emerald-400">
                {toPct(funnel.activation.trialConversionRate)}
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded p-2">
              <div className="text-gray-500">T1O Avg (h)</div>
              <div className="font-mono text-emerald-400">
                {funnel.activation.timeToFirstOrderHoursAvg.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded p-2">
              <div className="text-gray-500">T1O Median (h)</div>
              <div className="font-mono text-emerald-400">
                {funnel.activation.timeToFirstOrderHoursMedian.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded p-2">
              <div className="text-gray-500">Revenue / Activated Trial (¢)</div>
              <div className="font-mono text-emerald-400">
                {funnel.activation.revenuePerActivatedTrialCents}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-gray-800 border border-gray-700 rounded p-2">
              <div className="text-gray-500">Dropoff · Onboarding</div>
              <div className="font-mono text-amber-400">
                {funnel.activation.dropoffStep.onboarding}
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded p-2">
              <div className="text-gray-500">Dropoff · First Order</div>
              <div className="font-mono text-amber-400">
                {funnel.activation.dropoffStep.firstOrder}
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded p-2">
              <div className="text-gray-500">Dropoff · Paid Conversion</div>
              <div className="font-mono text-amber-400">
                {funnel.activation.dropoffStep.paidConversion}
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded p-2">
              <div className="text-gray-500">Activated (First Orders)</div>
              <div className="font-mono text-amber-400">
                {funnel.activation.dropoffStep.activated}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={downloadSnapshot}
            className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-sm font-medium transition-colors"
          >
            Export Funnel Snapshot CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
          <div className="bg-gray-800 border border-gray-700 rounded p-3 space-y-2">
            <h3 className="text-gray-300 font-semibold">By Country</h3>
            {Object.entries(segmentation.byCountry).map(([key, metrics]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-400">{key.toUpperCase()}</span>
                <span className="font-mono text-amber-400">
                  {toPct(metrics.rates.leadFromPage)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded p-3 space-y-2">
            <h3 className="text-gray-300 font-semibold">By Segment</h3>
            {Object.entries(segmentation.bySegment).map(([key, metrics]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-400">{key}</span>
                <span className="font-mono text-amber-400">
                  {toPct(metrics.rates.leadFromPage)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded p-3 space-y-3">
          <h3 className="text-gray-300 font-semibold">
            Activation Intelligence Layer v2
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <div className="text-gray-500">Worst Dropoff Step</div>
              <div className="font-mono text-amber-400">
                {activationInsights.worstDropoffStep}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Activation Velocity Score</div>
              <div className="font-mono text-emerald-400">
                {activationInsights.activationVelocityScore}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Org Class</div>
              <div className="font-mono text-emerald-400">
                {activationInsights.orgClassification}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-gray-500">Alerts</div>
            {activationInsights.alerts.length === 0 ? (
              <div className="text-emerald-400 font-mono">No active alerts</div>
            ) : (
              activationInsights.alerts.map((alert, index) => (
                <div
                  key={`activation-alert-${index}`}
                  className="text-amber-400 font-mono"
                >
                  {alert}
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <div className="text-gray-500">Top 3 Recommended Actions</div>
            {recommendedActions.length === 0 ? (
              <div className="text-emerald-400 font-mono">
                No recommended actions
              </div>
            ) : (
              recommendedActions.map((action, index) => (
                <div
                  key={`activation-action-${index}`}
                  className="bg-gray-900 border border-gray-700 rounded p-2 space-y-1"
                >
                  <div className="font-semibold text-amber-300">
                    {action.title}
                  </div>
                  <div className="text-gray-300">{action.reason}</div>
                  <div className="text-emerald-300 font-mono text-xs">
                    {action.automation}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Context Panel */}
      <section className="bg-gray-900 rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-300">Current Context</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {/* Country selector */}
          <div>
            <label className="block text-gray-500 mb-1">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as CountryCode)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1"
              title="Select country"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          {/* Segment selector */}
          <div>
            <label className="block text-gray-500 mb-1">Segment</label>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value as Segment)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1"
              title="Select segment"
            >
              {SEGMENTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {/* Device */}
          <div>
            <label className="block text-gray-500 mb-1">Device</label>
            <div className="bg-gray-800 border border-gray-700 rounded px-2 py-1">
              {device}
            </div>
          </div>
          {/* Landing version */}
          <div>
            <label className="block text-gray-500 mb-1">Landing Version</label>
            <div className="bg-gray-800 border border-gray-700 rounded px-2 py-1">
              {landing_version}
            </div>
          </div>
        </div>
      </section>

      {/* Fire test events */}
      <section className="bg-gray-900 rounded-xl p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-300">
          Fire Test Events
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={firePageView}
            className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-sm font-medium transition-colors"
          >
            page_view
          </button>
          <button
            onClick={fireWhatsApp}
            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm font-medium transition-colors"
          >
            cta_whatsapp_click
          </button>
          <button
            onClick={fireDemo}
            className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-sm font-medium transition-colors"
          >
            cta_demo_click
          </button>
          <button
            onClick={firePricing}
            className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-sm font-medium transition-colors"
          >
            pricing_view
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-sm font-medium transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </section>

      {/* Live stream */}
      <section className="bg-gray-900 rounded-xl p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-300">
          Live Events ({liveEvents.length})
        </h2>
        {liveEvents.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No events yet. Fire a test event or visit a landing page.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {[...liveEvents].reverse().map((evt, i) => (
              <div
                key={`live-${i}`}
                className="bg-gray-800 rounded-lg p-3 text-xs font-mono"
              >
                <span className="text-emerald-400 font-bold">{evt.event}</span>{" "}
                <span className="text-gray-500">{evt.timestamp}</span>
                <JsonBlock data={evt} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Buffer */}
      <section className="bg-gray-900 rounded-xl p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-300">
          Event Buffer — localStorage ({buffer.length})
        </h2>
        {buffer.length > 0 ? (
          <JsonBlock data={buffer} />
        ) : (
          <p className="text-gray-500 text-sm">Buffer is empty.</p>
        )}
      </section>

      {/* Leads */}
      <section className="bg-gray-900 rounded-xl p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-300">
          Captured Leads ({leads.length})
        </h2>
        {leads.length > 0 ? (
          <JsonBlock data={leads} />
        ) : (
          <p className="text-gray-500 text-sm">No leads captured yet.</p>
        )}
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-600 text-xs pt-4">
        Commercial Debug Console — ChefIApp OS — Internal Use Only
      </footer>
    </div>
  );
}
