import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Minus,
  X,
  Zap,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { track } from "../../analytics/track";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Status = "yes" | "partial" | "no";

interface ComparisonRow {
  feature: string;
  chefiapp: Status;
  leaderA: Status;
  leaderB: Status;
  leaderC: Status;
  legacy: Status;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const comparisonData: ComparisonRow[] = [
  { feature: "TPV completo (mesa + balcão + takeaway)", chefiapp: "yes", leaderA: "yes", leaderB: "yes", leaderC: "yes", legacy: "partial" },
  { feature: "KDS — ecrã de cozinha em tempo real", chefiapp: "yes", leaderA: "yes", leaderB: "partial", leaderC: "yes", legacy: "no" },
  { feature: "App da equipa integrada", chefiapp: "yes", leaderA: "partial", leaderB: "partial", leaderC: "partial", legacy: "no" },
  { feature: "Funciona offline (PWA)", chefiapp: "yes", leaderA: "yes", leaderB: "partial", leaderC: "partial", legacy: "no" },
  { feature: "Multi-idioma nativo", chefiapp: "yes", leaderA: "partial", leaderB: "yes", leaderC: "yes", legacy: "no" },
  { feature: "Dashboard do dono", chefiapp: "yes", leaderA: "yes", leaderB: "yes", leaderC: "yes", legacy: "partial" },
  { feature: "Reservas integradas", chefiapp: "yes", leaderA: "partial", leaderB: "no", leaderC: "partial", legacy: "no" },
  { feature: "Pedidos online", chefiapp: "yes", leaderA: "yes", leaderB: "yes", leaderC: "partial", legacy: "no" },
  { feature: "Gestão de inventário", chefiapp: "yes", leaderA: "partial", leaderB: "partial", leaderC: "yes", legacy: "partial" },
  { feature: "Multi-unidade", chefiapp: "yes", leaderA: "yes", leaderB: "yes", leaderC: "yes", legacy: "no" },
  { feature: "API aberta", chefiapp: "yes", leaderA: "partial", leaderB: "yes", leaderC: "yes", legacy: "no" },
  { feature: "Sem taxa por transacção", chefiapp: "yes", leaderA: "no", leaderB: "no", leaderC: "no", legacy: "yes" },
  { feature: "Preço fixo sem surpresas", chefiapp: "yes", leaderA: "no", leaderB: "no", leaderC: "partial", legacy: "yes" },
  { feature: "Sem hardware proprietário", chefiapp: "yes", leaderA: "no", leaderB: "partial", leaderC: "no", legacy: "no" },
  { feature: "Tudo incluído no plano base", chefiapp: "yes", leaderA: "no", leaderB: "no", leaderC: "no", legacy: "partial" },
  { feature: "Actualizações contínuas incluídas", chefiapp: "yes", leaderA: "yes", leaderB: "yes", leaderC: "yes", legacy: "no" },
];

const columns = [
  { key: "chefiapp" as const, label: "ChefiApp", highlight: true },
  { key: "leaderA" as const, label: "Líder A", highlight: false },
  { key: "leaderB" as const, label: "Líder B", highlight: false },
  { key: "leaderC" as const, label: "Líder C", highlight: false },
  { key: "legacy" as const, label: "POS Tradicional", highlight: false },
];

interface WhenCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const whenCards: WhenCard[] = [
  {
    icon: <Zap className="h-6 w-6 text-amber-500" />,
    title: "ChefiApp",
    description:
      "Quando precisa de tudo integrado — TPV, KDS, equipa, reservas — com preço fixo, sem taxas e sem hardware obrigatório.",
  },
  {
    icon: <Building2 className="h-6 w-6 text-white/50" />,
    title: "Líderes de mercado cloud",
    description:
      "Quando já opera num ecossistema específico e aceita pagar taxas por transacção e add-ons por funcionalidade.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-white/40" />,
    title: "POS tradicional",
    description:
      "Quando o hardware já está pago, a equipa conhece o sistema e não há necessidade de inovar o fluxo operacional.",
  },
];

/* ------------------------------------------------------------------ */
/*  Status badge component                                             */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: Status }) {
  switch (status) {
    case "yes":
      return (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-400">
          <Check className="h-4 w-4" />
          Sim
        </span>
      );
    case "partial":
      return (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-400">
          <Minus className="h-4 w-4" />
          Parcial
        </span>
      );
    case "no":
      return (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-white/30">
          <X className="h-4 w-4" />
          Não
        </span>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function MarketComparisonPage() {
  /* SEO meta tags */
  useEffect(() => {
    document.title =
      "ChefiApp vs. Líderes de Mercado — Comparação de POS para Restaurantes";

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(
        `meta[name="${name}"]`,
      ) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const setOg = (property: string, content: string) => {
      let el = document.querySelector(
        `meta[property="${property}"]`,
      ) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta(
      "description",
      "Comparação honesta entre ChefiApp e os líderes de mercado. Funcionalidades incluídas, custos reais e quando escolher cada tipo de sistema.",
    );
    setOg("og:title", "ChefiApp vs. Líderes de Mercado — Comparação de POS");
    setOg(
      "og:description",
      "Tabela comparativa de funcionalidades para restaurantes. Descubra porque o ChefiApp inclui tudo num único plano.",
    );
    setOg("og:type", "website");
  }, []);

  const trackCta = (cta: string, destination: string) => {
    track("marketing_compare_cta_click", {
      page: "compare",
      cta,
      destination,
    });
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white">
      {/* ── Sticky header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0b0f]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm text-white/50 no-underline transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
            <Link
              to="/"
              className="text-lg font-bold tracking-tight text-white no-underline"
            >
              Chefi<span className="text-amber-500">App</span>
            </Link>
          </div>
          <Link
            to="/auth/email"
            onClick={() => trackCta("header_cta", "/auth/email")}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black no-underline transition-colors hover:bg-amber-400"
          >
            Começar grátis
          </Link>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="px-4 pb-12 pt-16 text-center sm:px-6 md:pb-16 md:pt-24">
        <h1 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          ChefiApp vs.{" "}
          <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Líderes de mercado
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/50 sm:text-lg">
          Comparação honesta de funcionalidades entre o ChefiApp e os principais
          sistemas POS para restaurantes.
        </p>
      </section>

      {/* ── Comparison table ──────────────────────────────────── */}
      <section className="px-4 sm:px-6">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="sticky left-0 z-10 bg-[#0b0b0f] px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white/50 sm:px-6">
                    Funcionalidade
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-3 py-4 text-center text-xs font-semibold uppercase tracking-wider sm:px-4 ${
                        col.highlight
                          ? "border-x border-amber-500/30 bg-amber-500/5 text-amber-500"
                          : "text-white/50"
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${
                      i === comparisonData.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="sticky left-0 z-10 bg-[#0b0b0f] px-4 py-3.5 font-medium text-white/80 sm:px-6">
                      {row.feature}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-3 py-3.5 text-center sm:px-4 ${
                          col.highlight
                            ? "border-x border-amber-500/30 bg-amber-500/5"
                            : ""
                        }`}
                      >
                        <StatusBadge status={row[col.key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── When to choose each system ────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Quando escolher cada sistema
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {whenCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:border-white/20"
              >
                <div className="mb-4">{card.icon}</div>
                <h3 className="mb-2 text-base font-bold">{card.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Methodology disclaimer ────────────────────────────── */}
      <section className="px-4 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/40">
            Metodologia
          </h3>
          <p className="text-sm leading-relaxed text-white/50">
            Esta comparação baseia-se em documentação pública e materiais
            institucionais dos principais sistemas POS do mercado. Os dados são
            conservadores e reflectem o baseline público de cada categoria.
            "Líder A/B/C" representam os sistemas cloud mais adoptados
            globalmente. As funcionalidades podem mudar ao longo do tempo.
            Última revisão: Março 2026.
          </p>
        </div>
      </section>

      {/* ── Bottom CTA bar ────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm sm:p-12">
          <h2 className="mb-3 text-2xl font-bold sm:text-3xl">
            Pronto para experimentar?
          </h2>
          <p className="mb-8 text-white/50">
            Sem compromisso. Sem cartão de crédito. Configure o seu restaurante
            em minutos.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              to="/pricing"
              onClick={() => trackCta("bottom_pricing", "/pricing")}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white no-underline transition-colors hover:bg-white/10 sm:w-auto"
            >
              Ver preços
            </Link>
            <Link
              to="/auth/email"
              onClick={() => trackCta("bottom_start_free", "/auth/email")}
              className="w-full rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-black no-underline transition-colors hover:bg-amber-400 sm:w-auto"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer line ───────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-4 py-6 text-center sm:px-6">
        <p className="text-xs text-white/30">
          &copy; {new Date().getFullYear()} ChefiApp. Todos os direitos
          reservados.
        </p>
      </footer>
    </div>
  );
}
