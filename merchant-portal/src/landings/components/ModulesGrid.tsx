/**
 * ModulesGrid — Cards dos módulos POS, KDS, Staff Orchestrator, Analytics.
 * Ref: docs/commercial/GLOBAL_COMMERCIAL_OS.md
 */
import type { SupportedLocale } from "../countries";

export interface ModulesGridProps {
  locale: SupportedLocale;
}

const MODULES = [
  {
    id: "pos",
    icon: "🛒",
    title: { "pt-PT": "POS", es: "POS", "pt-BR": "POS", en: "POS" },
    desc: {
      "pt-PT": "Pedidos, mesas, pagamento em 2 toques",
      es: "Pedidos, mesas, pago en 2 toques",
      "pt-BR": "Pedidos, mesas, pagamento em 2 toques",
      en: "Orders, tables, 2-tap payment",
    },
  },
  {
    id: "kds",
    icon: "🍳",
    title: { "pt-PT": "KDS", es: "KDS", "pt-BR": "KDS", en: "KDS" },
    desc: {
      "pt-PT": "Display cozinha. Task Board quando idle",
      es: "Display cocina. Task Board cuando idle",
      "pt-BR": "Display cozinha. Task Board quando idle",
      en: "Kitchen display. Task Board when idle",
    },
  },
  {
    id: "staff",
    icon: "👥",
    title: {
      "pt-PT": "Staff Orchestrator",
      es: "Orquestrador de Equipo",
      "pt-BR": "Staff Orchestrator",
      en: "Staff Orchestrator",
    },
    desc: {
      "pt-PT": "Tarefas automáticas por zona e contexto",
      es: "Tareas automáticas por zona y contexto",
      "pt-BR": "Tarefas automáticas por zona e contexto",
      en: "Automatic tasks by zone and context",
    },
  },
  {
    id: "analytics",
    icon: "📊",
    title: {
      "pt-PT": "Analytics",
      es: "Analytics",
      "pt-BR": "Analytics",
      en: "Analytics",
    },
    desc: {
      "pt-PT": "Métricas em tempo real, heatmap",
      es: "Métricas en tiempo real, heatmap",
      "pt-BR": "Métricas em tempo real, heatmap",
      en: "Real-time metrics, heatmap",
    },
  },
] as const;

export function ModulesGrid({ locale }: ModulesGridProps) {
  return (
    <section className="py-24 bg-neutral-950 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
          {locale === "en"
            ? "Modules"
            : locale === "es"
              ? "Módulos"
              : "Módulos"}
        </h2>
        <p className="text-neutral-400 text-center mb-12">
          {locale === "en"
            ? "POS, KDS, Staff Orchestrator, Analytics."
            : locale === "es"
              ? "POS, KDS, Orquestrador de Equipo, Analytics."
              : "POS, KDS, Staff Orchestrator, Analytics."}
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {MODULES.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-white/10 bg-neutral-900/50 p-6"
            >
              <span className="text-2xl mb-3 block">{m.icon}</span>
              <h3 className="text-lg font-bold text-white mb-2">
                {m.title[locale]}
              </h3>
              <p className="text-sm text-neutral-400">{m.desc[locale]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
