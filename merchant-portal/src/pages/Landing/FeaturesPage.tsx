/**
 * PUBLIC_SITE_CONTRACT: /features — Site do sistema (marketing).
 * NÃO carrega Runtime nem Core. Funciona offline.
 *
 * Design system: bg-[#0b0b0f], glassmorphism cards, amber-500 accent.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  ChefHat,
  CreditCard,
  Monitor,
  Shield,
  Smartphone,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface FeatureGroup {
  title: string;
  description: string;
  icon: LucideIcon;
  items: string[];
}

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: "Operação no salão",
    description:
      "Tudo o que a equipa de sala precisa para servir rápido e sem erros.",
    icon: Monitor,
    items: [
      "TPV com fluxo mesa, balcão e takeaway",
      "Divisão de conta, desconto e fecho rápido",
      "Estado de pedidos em tempo real",
      "Atalhos de operação para pico de serviço",
    ],
  },
  {
    title: "Cozinha e despacho",
    description:
      "Visibilidade total entre sala e cozinha, sem gritos nem papéis.",
    icon: ChefHat,
    items: [
      "KDS em tempo real com priorização visual",
      "Marcação de pronto e histórico de tempo",
      "Sincronização imediata TPV ↔ cozinha",
      "Visibilidade por estação e equipa",
    ],
  },
  {
    title: "AppStaff",
    description:
      "Cada colaborador com a informação certa no momento certo.",
    icon: Smartphone,
    items: [
      "Clock-in por QR code",
      "Tarefas atribuídas por função",
      "Comunicação interna integrada",
      "Métricas pessoais de desempenho",
    ],
  },
  {
    title: "Gestão e análise",
    description:
      "Dashboard para o dono e relatórios que se geram sozinhos.",
    icon: BarChart3,
    items: [
      "Dashboard do dono com métricas do dia",
      "Relatórios automáticos por turno e período",
      "Alertas operacionais configuráveis",
      "Histórico completo de turnos e vendas",
    ],
  },
  {
    title: "Pagamentos",
    description:
      "Multimétodo, auditável e integrado com Stripe.",
    icon: CreditCard,
    items: [
      "Multimétodo: dinheiro, cartão, MB WAY",
      "Stripe integrado para pagamentos online",
      "Fecho de caixa auditável e reconciliação",
      "Relatório de movimentos por sessão",
    ],
  },
  {
    title: "Infraestrutura",
    description:
      "Segurança, performance e resiliência de nível enterprise.",
    icon: Shield,
    items: [
      "RLS por restaurante (isolamento total)",
      "Offline-first — funciona sem internet",
      "Multi-idioma (PT, EN, ES, FR)",
      "Actualizações contínuas sem downtime",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  SEO                                                                */
/* ------------------------------------------------------------------ */

function useSEO() {
  useEffect(() => {
    document.title = "Funcionalidades | ChefiApp — Sistema POS para restauração";

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const setOG = (property: string, content: string) => {
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

    const desc =
      "Descubra tudo o que o ChefiApp oferece: TPV, KDS, AppStaff, gestão, pagamentos e infraestrutura de nível enterprise para restauração.";

    setMeta("description", desc);
    setOG("og:title", "Funcionalidades | ChefiApp");
    setOG("og:description", desc);
    setOG("og:type", "website");
    setOG("og:url", "https://chefiapp.com/features");
  }, []);
}

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function FeatureCard({ group }: { group: FeatureGroup }) {
  const Icon = group.icon;

  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors duration-300 hover:border-amber-500/30 hover:bg-white/[0.07]">
      {/* Icon */}
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
        <Icon className="h-5 w-5 text-amber-500" />
      </div>

      {/* Title + description */}
      <div>
        <h3 className="mb-1 text-lg font-bold text-white">{group.title}</h3>
        <p className="text-sm leading-relaxed text-neutral-400">
          {group.description}
        </p>
      </div>

      {/* Items */}
      <ul className="mt-auto flex flex-col gap-2.5">
        {group.items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-sm leading-relaxed text-neutral-300"
          >
            <span className="mt-1.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500/60" />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function FeaturesPage() {
  useSEO();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0b0f] text-white">
      {/* ── Ambient glow ─────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[160px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-60 -right-40 h-[600px] w-[600px] rounded-full bg-amber-500/5 blur-[200px]"
      />

      {/* ── Sticky header ────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0b0b0f]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm text-neutral-400 no-underline transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <span className="hidden text-xs text-neutral-600 sm:inline">|</span>
            <Link
              to="/"
              className="hidden text-base font-bold tracking-tight text-white no-underline sm:inline"
            >
              Chefi<span className="text-amber-500">App</span>
            </Link>
          </div>

          <Link
            to="/auth/email"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-neutral-900 no-underline transition-colors hover:bg-amber-400"
          >
            Começar grátis
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-5 pb-4 pt-16 text-center md:pt-24">
        <span className="mb-4 inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1 text-xs font-medium tracking-wide text-amber-400">
          PLATAFORMA COMPLETA
        </span>
        <h1 className="mx-auto mb-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
          Funcionalidades do{" "}
          <span className="text-amber-500">ChefiApp</span>
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-neutral-400 md:text-lg">
          Tudo o que um restaurante precisa para operar, gerir e crescer
          — numa única plataforma pensada para a realidade da restauração.
        </p>
      </section>

      {/* ── Feature grid ─────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURE_GROUPS.map((group) => (
            <FeatureCard key={group.title} group={group} />
          ))}
        </div>
      </section>

      {/* ── Bottom CTA bar ───────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-5 pb-16">
        <div className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-white/10 bg-white/5 px-6 py-6 backdrop-blur-sm sm:flex-row">
          <p className="m-0 text-center text-sm text-neutral-400 sm:text-left">
            Quer ver como nos comparamos com a concorrência?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/compare"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white no-underline transition-colors hover:bg-white/10"
            >
              Comparativo
            </Link>
            <Link
              to="/pricing"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white no-underline transition-colors hover:bg-white/10"
            >
              Ver planos
            </Link>
            <Link
              to="/auth/email"
              className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-neutral-900 no-underline transition-colors hover:bg-amber-400"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer line ──────────────────────────────────── */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-neutral-600">
        &copy; {new Date().getFullYear()} ChefiApp — Sistema POS para restauração
      </footer>
    </div>
  );
}
