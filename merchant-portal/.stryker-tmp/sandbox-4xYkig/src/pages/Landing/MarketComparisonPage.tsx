import { Link } from "react-router-dom";
import { track } from "../../analytics/track";

type CapabilityStatus = "yes" | "partial" | "limited" | "unknown";

type CapabilityRow = {
  capability: string;
  chefiapp: CapabilityStatus;
  toast: CapabilityStatus;
  square: CapabilityStatus;
  lightspeed: CapabilityStatus;
  legacy: CapabilityStatus;
  notes?: string;
};

const rows: CapabilityRow[] = [
  {
    capability: "TPV para salão, balcão e takeaway",
    chefiapp: "yes",
    toast: "yes",
    square: "yes",
    lightspeed: "yes",
    legacy: "partial",
  },
  {
    capability: "KDS em tempo real",
    chefiapp: "yes",
    toast: "yes",
    square: "partial",
    lightspeed: "yes",
    legacy: "limited",
  },
  {
    capability: "App mobile para equipa (staff)",
    chefiapp: "yes",
    toast: "partial",
    square: "partial",
    lightspeed: "partial",
    legacy: "limited",
  },
  {
    capability: "Modo offline operacional",
    chefiapp: "yes",
    toast: "yes",
    square: "partial",
    lightspeed: "partial",
    legacy: "limited",
  },
  {
    capability: "Onboarding guiado para ativação",
    chefiapp: "yes",
    toast: "partial",
    square: "partial",
    lightspeed: "partial",
    legacy: "limited",
  },
  {
    capability: "Gestão de cardápio / catálogo",
    chefiapp: "yes",
    toast: "yes",
    square: "yes",
    lightspeed: "yes",
    legacy: "partial",
  },
  {
    capability: "Inventário e scanner de operação",
    chefiapp: "yes",
    toast: "partial",
    square: "partial",
    lightspeed: "yes",
    legacy: "limited",
  },
  {
    capability: "Dashboard operacional com métricas",
    chefiapp: "yes",
    toast: "yes",
    square: "partial",
    lightspeed: "yes",
    legacy: "limited",
  },
  {
    capability: "Alertas contextuais por operação",
    chefiapp: "yes",
    toast: "partial",
    square: "limited",
    lightspeed: "partial",
    legacy: "limited",
  },
  {
    capability: "Fluxo TPV + KDS + AppStaff integrado",
    chefiapp: "yes",
    toast: "partial",
    square: "limited",
    lightspeed: "partial",
    legacy: "limited",
  },
  {
    capability: "Faturação/billing no próprio sistema",
    chefiapp: "yes",
    toast: "yes",
    square: "yes",
    lightspeed: "yes",
    legacy: "limited",
  },
  {
    capability: "Configuração de dispositivos no painel",
    chefiapp: "yes",
    toast: "yes",
    square: "partial",
    lightspeed: "yes",
    legacy: "limited",
  },
];

const statusMap: Record<
  CapabilityStatus,
  { label: string; className: string }
> = {
  yes: {
    label: "Sim",
    className: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40",
  },
  partial: {
    label: "Parcial",
    className: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40",
  },
  limited: {
    label: "Limitado",
    className: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/40",
  },
  unknown: {
    label: "N/D",
    className: "bg-neutral-600/20 text-neutral-300 ring-1 ring-neutral-500/40",
  },
};

function Cell({ status }: { status: CapabilityStatus }) {
  const meta = statusMap[status];
  return (
    <span
      className={`inline-flex min-w-20 justify-center rounded-md px-2 py-1 text-xs font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

export function MarketComparisonPage() {
  const trackCompareCtaClick = (cta: string, destination: string) => {
    track("marketing_compare_cta_click", {
      page: "compare",
      cta,
      destination,
    });
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-5 py-12 text-neutral-100 md:py-16">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <Link
            to="/landing"
            className="mb-4 inline-block text-xs text-neutral-400 no-underline hover:text-neutral-200"
          >
            ← Voltar à landing oficial
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Comparativo Técnico — ChefIApp vs Players do Mercado
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-neutral-400 md:text-base">
            Esta página existe para comparar capacidades de operação em um plano
            único. O foco é técnico-operacional: o que cada plataforma entrega
            no dia a dia do restaurante.
          </p>
        </header>

        <section className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 text-xs text-neutral-300 md:text-sm">
          <p className="m-0 leading-relaxed">
            Metodologia: baseline público e conservador, com base em materiais
            institucionais e documentação aberta dos fornecedores. Pode mudar ao
            longo do tempo; revisar periodicamente antes de campanhas
            comerciais.
          </p>
        </section>

        <section className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/60">
          <table className="min-w-full w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900">
                <th className="px-4 py-3 text-left font-semibold text-neutral-200">
                  Capacidade
                </th>
                <th className="px-3 py-3 text-center font-semibold text-amber-300">
                  ChefIApp
                </th>
                <th className="px-3 py-3 text-center font-semibold text-neutral-300">
                  Toast
                </th>
                <th className="px-3 py-3 text-center font-semibold text-neutral-300">
                  Square
                </th>
                <th className="px-3 py-3 text-center font-semibold text-neutral-300">
                  Lightspeed
                </th>
                <th className="px-3 py-3 text-center font-semibold text-neutral-300">
                  POS legado
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.capability}
                  className="border-b border-neutral-800/80"
                >
                  <td className="px-4 py-3 text-neutral-200">
                    {row.capability}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Cell status={row.chefiapp} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Cell status={row.toast} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Cell status={row.square} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Cell status={row.lightspeed} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Cell status={row.legacy} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6 grid gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 md:grid-cols-2">
          <div>
            <h2 className="mb-2 text-lg font-semibold">Leitura estratégica</h2>
            <ul className="grid gap-2 pl-5 text-sm text-neutral-300">
              <li>ChefIApp concentra operação integrada em um fluxo único.</li>
              <li>
                Diferencial central: convergência TPV + KDS + AppStaff com
                contexto operacional.
              </li>
              <li>
                Modelo orientado a restaurantes que precisam velocidade no chão
                de loja.
              </li>
            </ul>
            <h3 className="mb-2 mt-4 text-base font-semibold">
              Quando escolher ChefIApp
            </h3>
            <ul className="grid gap-2 pl-5 text-sm text-neutral-300">
              <li>
                Quando TPV + KDS + equipa precisam operar como um sistema único.
              </li>
              <li>
                Quando o tempo de serviço no pico é prioridade de negócio.
              </li>
              <li>
                Quando quer ativação rápida sem depender de múltiplos módulos
                isolados.
              </li>
            </ul>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold">Próximos passos</h2>
            <p className="mb-3 text-sm text-neutral-400">
              Faça um teste real de operação com o seu fluxo e compare tempo de
              atendimento, qualidade de despacho e estabilidade do turno.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/features"
                onClick={() => trackCompareCtaClick("features", "/features")}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-sm text-neutral-100 no-underline hover:bg-neutral-700"
              >
                Ver funcionalidades
              </Link>
              <Link
                to="/landing"
                onClick={() => trackCompareCtaClick("contact_team", "/landing")}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-sm text-neutral-100 no-underline hover:bg-neutral-700"
              >
                Falar com equipa
              </Link>
              <Link
                to="/pricing"
                onClick={() => trackCompareCtaClick("pricing", "/pricing")}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-sm text-neutral-100 no-underline hover:bg-neutral-700"
              >
                Ver planos
              </Link>
              <Link
                to="/auth/phone"
                onClick={() => trackCompareCtaClick("try_now", "/auth/phone")}
                className="rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-bold text-neutral-900 no-underline hover:bg-amber-400"
              >
                Testar agora
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
