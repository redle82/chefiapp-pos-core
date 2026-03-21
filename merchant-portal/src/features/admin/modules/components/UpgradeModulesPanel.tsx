/**
 * UpgradeModulesPanel — Module upsell engine inside dashboard.
 *
 * Shows locked modules based on resolveActiveModules(billingStatus, plan).
 * Each locked module: Benefit, Estimated ROI, CTA "Upgrade Plan".
 * Tracks upgrade_click, module_interest.
 */
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  getMinimumTier,
  resolveActiveModules,
  type ModuleKey,
} from "../../../../../../billing-core/featureFlags";
import type { PlanTier } from "../../../../../../billing-core/types";
import { normalizeLegacyStatus } from "../../../../../../billing-core/billingStateMachine";
import {
  commercialTracking,
  detectDevice,
  isCommercialTrackingEnabled,
} from "../../../../commercial/tracking";
import { useSubscription } from "../../../../hooks/useSubscription";

const ALL_MODULE_KEYS: ModuleKey[] = [
  "core_pos",
  "core_kds",
  "team_management",
  "team_pulse",
  "team_tasks",
  "analytics_basic",
  "analytics_pro",
  "billing_management",
  "inventory",
  "marketing_crm",
  "exports",
  "audit_dashboard",
  "compliance",
];

const MODULE_META: Record<
  ModuleKey,
  { label: string; benefit: string; roi: string }
> = {
  core_pos: {
    label: "TPV",
    benefit: "Pagamentos rápidos, mesa, balcão e takeaway num só lugar",
    roi: "+15% throughput",
  },
  core_kds: {
    label: "KDS",
    benefit: "Ecrã de cozinha em tempo real, menos erros de pedidos",
    roi: "-30% tempo preparação",
  },
  team_management: {
    label: "Gestão de Equipa",
    benefit: "Turnos, fichagem e presença automatizados",
    roi: "+20% eficiência",
  },
  team_pulse: {
    label: "Team Pulse",
    benefit: "Leituras de pulse e gamificação para a equipa",
    roi: "+25% engagement",
  },
  team_tasks: {
    label: "Sistema de Tarefas",
    benefit: "Tarefas recorrentes e checklist operacional",
    roi: "-40% tarefas esquecidas",
  },
  analytics_basic: {
    label: "Analytics Básico",
    benefit: "Dashboard diário e métricas do dia",
    roi: "Visibilidade total",
  },
  analytics_pro: {
    label: "Analytics Pro",
    benefit: "Relatórios avançados, heatmaps e pulse analytics",
    roi: "+30% decisões data-driven",
  },
  billing_management: {
    label: "Gestão de Billing",
    benefit: "Subscrição, planos e faturação",
    roi: "Self-service",
  },
  inventory: {
    label: "Inventário",
    benefit: "Stock, alertas de níveis baixos e relatórios",
    roi: "-20% desperdício",
  },
  marketing_crm: {
    label: "Marketing CRM",
    benefit: "Campanhas e CRM para fidelização",
    roi: "+35% retenção",
  },
  exports: {
    label: "Exportações",
    benefit: "Export CSV/PDF de relatórios",
    roi: "Compliance facilitado",
  },
  audit_dashboard: {
    label: "Audit Dashboard",
    benefit: "Logs de auditoria e orquestrador",
    roi: "Traçabilidade total",
  },
  compliance: {
    label: "Compliance Fiscal",
    benefit: "Certificação AT e compliance fiscal",
    roi: "100% legal",
  },
};

function trackEvent(
  event: "upgrade_click" | "module_interest",
  payload: { module?: string; placement?: string }
) {
  if (!isCommercialTrackingEnabled()) return;
  const base = {
    timestamp: new Date().toISOString(),
    country: "gb" as const,
    segment: "small" as const,
    landing_version: "dashboard-v1",
    device: detectDevice(),
    path: typeof window !== "undefined" ? window.location.pathname : "",
  };
  if (event === "upgrade_click") {
    commercialTracking.track({ ...base, event: "upgrade_click", ...payload });
  } else {
    commercialTracking.track({
      ...base,
      event: "module_interest",
      module: payload.module ?? "",
    });
  }
}

export function UpgradeModulesPanel() {
  const { t } = useTranslation("sidebar");
  const navigate = useNavigate();
  const { subscription, loading } = useSubscription();

  const lockedModules = useCallback((): ModuleKey[] => {
    if (!subscription) return [];
    const billingStatus = normalizeLegacyStatus(
      subscription.status === "trialing" ? "trial" : subscription.status
    ) as Parameters<typeof resolveActiveModules>[0];
    const plan = subscription.plan_tier as PlanTier;
    const active = new Set(resolveActiveModules(billingStatus, plan));
    return ALL_MODULE_KEYS.filter((m) => !active.has(m));
  }, [subscription]);

  const locked = lockedModules();

  const handleUpgradeClick = useCallback(
    (module: ModuleKey) => {
      trackEvent("upgrade_click", { module, placement: "upgrade_panel" });
      navigate("/app/billing");
    },
    [navigate]
  );

  const handleModuleInterest = useCallback((module: ModuleKey) => {
    trackEvent("module_interest", { module });
  }, []);

  if (loading || locked.length === 0) return null;

  return (
    <section className="mt-8 p-4 rounded-xl bg-neutral-900/50 border border-amber-500/20">
      <h2 className="text-sm font-semibold text-amber-200/90 uppercase tracking-wide mb-4">
        {t("modules.actionUpgrade", { defaultValue: "Desbloqueia mais módulos" })}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {locked.map((key) => {
          const meta = MODULE_META[key];
          const minTier = getMinimumTier(key);
          if (!meta) return null;
          return (
            <div
              key={key}
              className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700/50"
              onMouseEnter={() => handleModuleInterest(key)}
            >
              <h3 className="font-semibold text-white mb-1">{meta.label}</h3>
              <p className="text-sm text-neutral-400 mb-2">{meta.benefit}</p>
              <p className="text-xs text-amber-400/80 mb-3">
                ROI estimado: {meta.roi}
              </p>
              <button
                type="button"
                onClick={() => handleUpgradeClick(key)}
                className="w-full py-2 px-3 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
              >
                {t("modules.actionUpgrade", {
                  defaultValue: "Upgrade Plan",
                })}
                {minTier ? ` (${minTier})` : ""}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
