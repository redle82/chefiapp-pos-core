/**
 * PUBLIC_SITE_CONTRACT: /pricing — Standalone pricing page (marketing).
 * Does NOT load Runtime or Core. Works offline.
 *
 * Design system: LandingV2 premium glassmorphism.
 * Accent: amber-500. Zero inline styles. Tailwind only. Mobile-first.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Mail,
  Minus,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  PRICING_TIERS,
  PRICE_ESSENCIAL,
  type PricingTier,
} from "../../core/pricing/canonicalPrice";

/* ─── FAQ ─── */
const FAQ_ITEMS = [
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. Sem fidelização, sem multas, sem períodos mínimos. Cancelas no painel e exportas os teus dados — são teus.",
  },
  {
    q: "Preciso de hardware especial?",
    a: "Não. Funciona em qualquer dispositivo com browser — tablet, telemóvel ou PC. Sem investimento inicial em equipamento.",
  },
  {
    q: "E se o meu restaurante tiver várias unidades?",
    a: "O plano Enterprise inclui localizações ilimitadas com dashboard centralizado. Os planos Essencial e Profissional suportam até 1 e 2 localizações respectivamente.",
  },
  {
    q: "O trial inclui todas as funcionalidades?",
    a: "Sim. 14 dias completos com acesso total ao plano Profissional. Sem restrições de funcionalidade, sem limites artificiais.",
  },
  {
    q: "Posso mudar de plano depois?",
    a: "Sim. Podes fazer upgrade ou downgrade a qualquer momento. A mudança aplica-se imediatamente e o valor é ajustado no ciclo seguinte.",
  },
  {
    q: "Posso importar o meu menu actual?",
    a: "Sim. Podes importar o teu cardápio durante o onboarding ou adicioná-lo manualmente — o processo é rápido.",
  },
  {
    q: "E se ficar sem internet?",
    a: "O ChefiApp funciona como PWA e aguenta interrupções curtas de rede. O serviço não pára por uma queda rápida de Wi-Fi.",
  },
  {
    q: "Existe alguma taxa por transacção?",
    a: "Não. Zero taxas por transacção em todos os planos. O preço que vês é o preço que pagas. As taxas do processador de pagamento (Stripe) são as normais do mercado e vão directamente para eles, não para nós.",
  },
] as const;

/* ─── Market comparison ─── */
const COMPETITORS = [
  {
    name: "ChefiApp",
    price: `${PRICE_ESSENCIAL}–199 €/mês`,
    note: "Tudo incluído, sem taxas",
    highlight: true,
  },
  {
    name: "Líder de mercado A",
    price: "~69–165 $/mês + taxas",
    note: "Taxas de 2.5–3% por transacção",
    highlight: false,
  },
  {
    name: "Líder de mercado B",
    price: "~49–99 $/mês + hardware",
    note: "Hardware proprietário obrigatório",
    highlight: false,
  },
  {
    name: "Líder de mercado C",
    price: "~89–109 $/mês",
    note: "Módulos extra pagos separadamente",
    highlight: false,
  },
] as const;

/* ─── Trust Signals ─── */
const TRUST_SIGNALS = [
  { Icon: ShieldCheck, label: "Sem cartão de crédito" },
  { Icon: Clock, label: "14 dias grátis" },
  { Icon: X, label: "Cancela a qualquer momento" },
] as const;

/* ─── Tier Card ─── */
function TierCard({ tier }: { tier: PricingTier }) {
  return (
    <div
      className={`relative rounded-2xl border backdrop-blur-xl overflow-hidden shadow-2xl transition-all ${
        tier.popular
          ? "border-amber-500/30 bg-neutral-900/50 ring-1 ring-amber-500/10 shadow-amber-500/5 scale-[1.02] md:scale-105"
          : "border-white/10 bg-white/[0.03] shadow-black/20"
      }`}
    >
      {tier.popular && (
        <>
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/[0.08] rounded-full blur-[100px] pointer-events-none" />
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        </>
      )}

      <div className="relative p-6 md:p-8">
        {/* Popular badge */}
        {tier.popular && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
            </span>
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
              Mais popular
            </span>
          </div>
        )}

        {/* Name + tagline */}
        <h3 className="text-lg font-bold text-white">{tier.name}</h3>
        <p className="text-sm text-neutral-500 mb-4">{tier.tagline}</p>

        {/* Price */}
        {tier.price !== null ? (
          <>
            <div className="flex items-baseline gap-1 mb-1">
              <span
                className={`text-4xl md:text-5xl font-black tabular-nums ${
                  tier.popular
                    ? "bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent"
                    : "text-white"
                }`}
              >
                {tier.price}€
              </span>
              <span className="text-neutral-500">/mês</span>
            </div>
            <p className="text-neutral-500 text-xs mb-6">
              após 14 dias de teste gratuito
            </p>
          </>
        ) : (
          <>
            <div className="mb-1">
              <span className="text-3xl md:text-4xl font-black text-white">
                Sob consulta
              </span>
            </div>
            <p className="text-neutral-500 text-xs mb-6">
              arquitectura e pricing personalizado
            </p>
          </>
        )}

        {/* CTA */}
        {tier.id === "custom" ? (
          <a
            href="mailto:contacto@chefiapp.com"
            className="group flex items-center justify-center w-full px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5 mb-6 border border-white/10 text-white hover:border-amber-500/30 hover:bg-white/5"
          >
            Falar connosco
            <Mail className="w-4 h-4 ml-2" />
          </a>
        ) : (
          <Link
            to="/auth/email"
            className={`group flex items-center justify-center w-full px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5 mb-6 ${
              tier.popular
                ? "bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30"
                : "border border-white/10 text-white hover:border-amber-500/30 hover:bg-white/5"
            }`}
          >
            Começar 14 dias grátis
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        )}

        {/* Features */}
        <div className="space-y-2.5">
          {tier.features.map((f) => (
            <div key={f} className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 text-amber-500" />
              </div>
              <span className="text-sm text-neutral-300">{f}</span>
            </div>
          ))}
        </div>

        {/* Not included */}
        {tier.notIncluded.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            {tier.notIncluded.map((f) => (
              <div key={f} className="flex items-start gap-2.5">
                <Minus className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
                <span className="text-sm text-neutral-600">{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── FAQ Accordion Item ─── */
function FAQAccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`border-b border-white/5 transition-colors duration-300 ${
        open ? "bg-neutral-900/30" : "hover:bg-neutral-900/20"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 px-5 md:px-6 text-left group cursor-pointer"
      >
        <span className="text-sm md:text-base font-semibold text-white pr-4 group-hover:text-amber-500/90 transition-colors duration-200">
          {q}
        </span>
        <span
          className={`text-neutral-500 transition-all duration-300 shrink-0 ${
            open ? "rotate-45 text-amber-500" : ""
          }`}
        >
          <Plus className="w-5 h-5" />
        </span>
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: open ? contentRef.current?.scrollHeight ?? 200 : 0,
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-5 md:px-6 pb-5">
          <p className="text-sm text-neutral-400 leading-relaxed max-w-3xl">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── SEO meta helper ─── */
function usePageMeta(title: string, description: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;

    const setOrCreate = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setOrCreate("name", "description", description);
    setOrCreate("property", "og:title", title);
    setOrCreate("property", "og:description", description);
    setOrCreate("property", "og:type", "website");
    setOrCreate("property", "og:url", "https://chefiapp.com/pricing");

    return () => {
      document.title = prev;
    };
  }, [title, description]);
}

/* ─── Main Page ─── */
export function PricingPage() {
  usePageMeta(
    "Preços — ChefiApp | Sistema operacional para restaurantes",
    `ChefiApp — do essencial ao enterprise. A partir de ${PRICE_ESSENCIAL} €/mês após 14 dias grátis. TPV, KDS, dashboard, alertas e mais. Sem surpresas, sem taxas.`,
  );

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/5 rounded-full blur-[200px] pointer-events-none" />

      {/* ── Header ── */}
      <section className="relative pt-12 pb-6 px-6">
        <div className="max-w-6xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-amber-500 transition-colors mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>

          <div className="text-center max-w-2xl mx-auto">
            <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
              Preços
            </p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Um sistema.{" "}
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                O plano certo para ti.
              </span>
            </h1>
            <p className="text-neutral-400 text-lg">
              Sem surpresas, sem módulos extra, sem taxas por transacção.
              Escolhe o plano certo para o teu restaurante.
            </p>
          </div>
        </div>
      </section>

      {/* ── Badge ── */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
            14 dias grátis em todos os planos
          </span>
        </div>
      </div>

      {/* ── Pricing Cards ── */}
      <section className="relative px-6 pb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {PRICING_TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </div>
      </section>

      {/* ── Zero taxas highlight ── */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm p-6 md:p-8 text-center">
            <h3 className="text-xl font-bold mb-2">
              Zero taxas por transacção.{" "}
              <span className="text-amber-500">Em todos os planos.</span>
            </h3>
            <p className="text-neutral-400 text-sm max-w-xl mx-auto">
              Um restaurante com 30.000 €/mês de facturação paga ~750 €/mês só
              em taxas com outros sistemas (2.5%). Connosco: 0 €. O preço do
              plano é tudo o que pagas.
            </p>
          </div>
        </div>
      </section>

      {/* ── Trust Signals ── */}
      <section className="px-6 pb-20">
        <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TRUST_SIGNALS.map((signal) => (
            <div
              key={signal.label}
              className="flex items-center gap-3 justify-center rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
            >
              <signal.Icon className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-sm text-neutral-400">{signal.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Competitor Comparison ── */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
              Comparação
            </p>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
              Como nos comparamos
            </h2>
            <p className="text-neutral-400 text-sm max-w-xl mx-auto">
              Preços aproximados de mercado. Consulte cada fornecedor para
              valores actualizados.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {COMPETITORS.map((comp) => (
              <div
                key={comp.name}
                className={`rounded-2xl border p-5 text-center transition-colors ${
                  comp.highlight
                    ? "border-amber-500/30 bg-amber-500/5 ring-1 ring-amber-500/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <p
                  className={`text-sm font-bold mb-2 ${
                    comp.highlight ? "text-amber-500" : "text-neutral-300"
                  }`}
                >
                  {comp.name}
                </p>
                <p className="text-lg font-bold mb-1">{comp.price}</p>
                <p className="text-xs text-neutral-500">{comp.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 pb-24 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/3 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
              Perguntas frequentes
            </p>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
              Dúvidas?{" "}
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                Respostas claras.
              </span>
            </h2>
          </div>

          <div className="rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm shadow-2xl shadow-black/30 ring-1 ring-white/5">
            {FAQ_ITEMS.map((item) => (
              <FAQAccordionItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
            Ainda tem dúvidas?
          </h2>
          <p className="text-neutral-400 mb-8">
            Fale connosco. Respondemos rápido e sem pressão.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:contacto@chefiapp.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white hover:border-amber-500/30 hover:bg-white/5 transition-all text-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              contacto@chefiapp.com
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-xs text-neutral-600">
            &copy; {new Date().getFullYear()} ChefiApp
          </span>
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-xs text-neutral-500 hover:text-amber-500 transition-colors"
            >
              Início
            </Link>
            <Link
              to="/features"
              className="text-xs text-neutral-500 hover:text-amber-500 transition-colors"
            >
              Features
            </Link>
            <Link
              to="/auth/email"
              className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
