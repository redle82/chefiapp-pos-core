/**
 * ActivationDashboard -- Metricas de activacao de restaurantes
 *
 * Mostra onde cada restaurante esta no funil de activacao,
 * tempos medios, taxas de conversao e resultados de comissionamento.
 * Visual: dark theme (zinc), Tailwind CSS bars, lucide icons.
 */

import { useState, useEffect } from "react";
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Zap,
  XCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RestaurantActivationMetrics {
  totalRestaurants: number;
  byPhase: {
    setup: number;
    installing: number;
    activating: number;
    commissioning: number;
    operational: number;
    stalled: number;
  };
  averageTimes: {
    setupToActivateMs: number;
    installToTpvMs: number;
    tpvToOperationalMs: number;
    totalMs: number;
  };
  conversionRates: {
    authToSetup: number;
    setupToActivate: number;
    activateToInstall: number;
    installToTpv: number;
    tpvToOperational: number;
  };
  commissioningResults: {
    passed: number;
    failed: number;
    pending: number;
    commonFailures: Array<{ test: string; count: number }>;
  };
}

// ---------------------------------------------------------------------------
// Mock data (TODO: replace with real API call)
// ---------------------------------------------------------------------------

function getMockMetrics(): RestaurantActivationMetrics {
  return {
    totalRestaurants: 47,
    byPhase: {
      setup: 12,
      installing: 5,
      activating: 8,
      commissioning: 3,
      operational: 15,
      stalled: 4,
    },
    averageTimes: {
      setupToActivateMs: 38 * 60 * 1000,
      installToTpvMs: 12 * 60 * 1000,
      tpvToOperationalMs: 25 * 60 * 1000,
      totalMs: 75 * 60 * 1000,
    },
    conversionRates: {
      authToSetup: 0.89,
      setupToActivate: 0.72,
      activateToInstall: 0.85,
      installToTpv: 0.91,
      tpvToOperational: 0.78,
    },
    commissioningResults: {
      passed: 15,
      failed: 2,
      pending: 3,
      commonFailures: [
        { test: "printer_check", count: 5 },
        { test: "kds_receive", count: 2 },
        { test: "staff_app_check", count: 3 },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}min`;
}

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

// ---------------------------------------------------------------------------
// Phase config
// ---------------------------------------------------------------------------

const PHASE_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof Users }
> = {
  setup: { label: "Em Setup", color: "text-blue-400", icon: Users },
  installing: { label: "Instalando TPV", color: "text-purple-400", icon: Zap },
  activating: {
    label: "Ativando",
    color: "text-amber-400",
    icon: TrendingUp,
  },
  commissioning: {
    label: "Comissionamento",
    color: "text-cyan-400",
    icon: BarChart3,
  },
  operational: {
    label: "Operacional",
    color: "text-green-400",
    icon: CheckCircle2,
  },
  stalled: { label: "Parado", color: "text-red-400", icon: AlertTriangle },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KPICard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  accent?: string;
}) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${accent ?? "text-zinc-400"}`} />
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <div className={`text-xl font-bold ${accent ?? "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function FunnelBar({ label, rate }: { label: string; rate: number }) {
  const width = Math.round(rate * 100);
  const color =
    rate >= 0.8 ? "bg-green-500" : rate >= 0.6 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-zinc-300">{label}</span>
        <span className="text-zinc-400 font-mono">{formatPercent(rate)}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function TimeRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`text-sm ${bold ? "text-white font-semibold" : "text-zinc-400"}`}
      >
        {label}
      </span>
      <span
        className={`font-mono text-sm ${bold ? "text-amber-400 font-semibold" : "text-zinc-300"}`}
      >
        {formatDuration(value)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ActivationDashboard() {
  const [metrics, setMetrics] =
    useState<RestaurantActivationMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real API call to fetch activation metrics
    const timer = setTimeout(() => {
      setMetrics(getMockMetrics());
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-zinc-500">
          A carregar metricas...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Dashboard de Activacao
        </h1>
        <p className="text-zinc-400 mt-1">
          Estado dos restaurantes no funil de activacao
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Total Restaurantes"
          value={metrics.totalRestaurants.toString()}
          icon={Users}
        />
        <KPICard
          label="Operacionais"
          value={metrics.byPhase.operational.toString()}
          icon={CheckCircle2}
          accent="text-green-400"
        />
        <KPICard
          label="Tempo Medio Total"
          value={formatDuration(metrics.averageTimes.totalMs)}
          icon={Clock}
        />
        <KPICard
          label="Taxa Conversao"
          value={formatPercent(metrics.conversionRates.tpvToOperational)}
          icon={TrendingUp}
          accent="text-amber-400"
        />
      </div>

      {/* Phase Distribution */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Distribuicao por Fase
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(metrics.byPhase).map(([phase, count]) => {
            const config = PHASE_CONFIG[phase];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <div
                key={phase}
                className="text-center p-4 bg-zinc-800/50 rounded-lg"
              >
                <Icon className={`w-6 h-6 ${config.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold text-white">{count}</div>
                <div className="text-xs text-zinc-400 mt-1">{config.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Funnel Conversion */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Funil de Conversao
        </h2>
        <div className="space-y-3">
          {[
            {
              label: "Auth \u2192 Setup",
              rate: metrics.conversionRates.authToSetup,
            },
            {
              label: "Setup \u2192 Activar",
              rate: metrics.conversionRates.setupToActivate,
            },
            {
              label: "Activar \u2192 Instalar",
              rate: metrics.conversionRates.activateToInstall,
            },
            {
              label: "Instalar \u2192 TPV",
              rate: metrics.conversionRates.installToTpv,
            },
            {
              label: "TPV \u2192 Operacional",
              rate: metrics.conversionRates.tpvToOperational,
            },
          ].map((step) => (
            <FunnelBar key={step.label} label={step.label} rate={step.rate} />
          ))}
        </div>
      </div>

      {/* Average Times + Commissioning */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Average Times */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Tempos Medios
          </h2>
          <div className="space-y-4">
            <TimeRow
              label="Setup \u2192 Activacao"
              value={metrics.averageTimes.setupToActivateMs}
            />
            <TimeRow
              label="Instalacao \u2192 TPV"
              value={metrics.averageTimes.installToTpvMs}
            />
            <TimeRow
              label="TPV \u2192 Operacional"
              value={metrics.averageTimes.tpvToOperationalMs}
            />
            <div className="border-t border-zinc-700 pt-3">
              <TimeRow
                label="Total"
                value={metrics.averageTimes.totalMs}
                bold
              />
            </div>
          </div>
        </div>

        {/* Commissioning Results */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Comissionamento
          </h2>
          <div className="flex gap-6 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {metrics.commissioningResults.passed}
              </div>
              <div className="text-xs text-zinc-400">Aprovados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {metrics.commissioningResults.failed}
              </div>
              <div className="text-xs text-zinc-400">Falhados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-zinc-400">
                {metrics.commissioningResults.pending}
              </div>
              <div className="text-xs text-zinc-400">Pendentes</div>
            </div>
          </div>
          {metrics.commissioningResults.commonFailures.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-300 mb-2">
                Falhas frequentes
              </h3>
              <div className="space-y-2">
                {metrics.commissioningResults.commonFailures.map((f) => (
                  <div
                    key={f.test}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-zinc-400 flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                      {f.test}
                    </span>
                    <span className="text-zinc-500">{f.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
