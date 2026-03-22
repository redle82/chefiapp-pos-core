/**
 * PUBLIC_SITE_CONTRACT: /pricing — Standalone pricing page (marketing).
 * Does NOT load Runtime or Core. Works offline.
 * Ref: Bloco 4 item 20 — ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md
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
  CANONICAL_MONTHLY_PRICE_EUR,
  CANONICAL_MONTHLY_PRICE_LABEL,
} from "../../core/pricing/canonicalPrice";

/* ─── Features ─── */
const FEATURES = [
  "TPV completo (caixa + mesa + balcão)",
  "KDS — ecrã de cozinha em tempo real",
  "Dashboard do dono com métricas do dia",
  "Alertas operacionais automáticos",
  "Gestão de cardápio e categorias",
  "Histórico de turnos e vendas",
  "Funciona offline (PWA)",
  "AppStaff — app da equipa",
  "Reservas integradas",
  "Multi-idioma (PT/EN/ES)",
  "Actualizações contínuas incluídas",
  "Suporte por email e WhatsApp",
] as const;

/* ─── Included vs Not Included ─── */
const INCLUDED = [
  "Todas as funcionalidades do plano",
  "Actualizações e novas features",
  "Suporte por email e WhatsApp",
  "Onboarding guiado",
  "Exportação de dados",
  "Multi-dispositivo ilimitado",
] as const;

const NOT_INCLUDED = [
  "Hardware físico (tablets, impressoras)",
  "Consultoria presencial",
  "Integrações custom sob medida",
] as const;

/* ─── Competitors ─── */
const COMPETITORS = [
  {
    name: "ChefiApp",
    price: `${CANONICAL_MONTHLY_PRICE_EUR} €/mês`,
    note: "Tudo incluído",
    highlight: true,
  },
  {
    name: "Toast",
    price: "~69 $/mês + taxas",
    note: "Taxas adicionais",
    highlight: false,
  },
  {
    name: "Square",
    price: "~60 $/mês + hardware",
    note: "Hardware obrigatório",
    highlight: false,
  },
  {
    name: "Lightspeed",
    price: "~69 $/mês",
    note: "Módulos extra pagos",
    highlight: false,
  },
] as const;

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
    a: "Contacta-nos para um plano multi-unidade. Adaptamos o preço e a configuração ao teu cenário.",
  },
  {
    q: "O trial inclui todas as funcionalidades?",
    a: "Sim. 14 dias completos com acesso total. Sem restrições de funcionalidade, sem limites artificiais.",
  },
  {
    q: "Como funciona o suporte?",
    a: "Suporte por email e WhatsApp em horário alargado. Respondemos em menos de 24h, normalmente bem mais rápido.",
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
    q: "Como funciona a facturação?",
    a: `O plano custa ${CANONICAL_MONTHLY_PRICE_LABEL}, facturado mensalmente após os 14 dias de teste. Sem custos escondidos, sem módulos extra.`,
  },
] as const;

/* ─── Trust Signals ─── */
const TRUST_SIGNALS = [
  { Icon: ShieldCheck, label: "Sem cartão de crédito" },
  { Icon: Clock, label: "Sem compromisso" },
  { Icon: X, label: "Cancela a qualquer momento" },
] as const;

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
    `ChefiApp — um plano, tudo incluído. ${CANONICAL_MONTHLY_PRICE_EUR} €/mês após 14 dias grátis. TPV, KDS, dashboard, alertas e suporte. Sem surpresas.`,
  );

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/5 rounded-full blur-[200px] pointer-events-none" />

        {/* ── Header ── */}
        <section className="relative pt-12 pb-6 px-6">
          <div className="max-w-4xl mx-auto">
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
                Um plano.{" "}
                <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                  Tudo incluído.
                </span>
              </h1>
              <p className="text-neutral-400 text-lg">
                Sem surpresas, sem módulos extra. O preço é o mesmo para todos.
              </p>
            </div>
          </div>
        </section>

        {/* ── Badge ── */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
              14 dias grátis
            </span>
          </div>
        </div>

        {/* ── Main Pricing Card ── */}
        <section className="relative px-6 pb-16">
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl border border-amber-500/20 bg-neutral-900/50 backdrop-blur-xl overflow-hidden relative shadow-2xl shadow-amber-500/5 ring-1 ring-white/5">
              {/* Card ambient */}
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/[0.08] rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-600/[0.06] rounded-full blur-[100px] pointer-events-none" />
              <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

              <div className="relative p-8 md:p-10">
                {/* Plan name */}
                <p className="text-sm text-neutral-400 font-medium mb-2">
                  Plano Profissional
                </p>

                {/* Price */}
                <div className="mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl md:text-7xl font-black bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent tabular-nums">
                      {CANONICAL_MONTHLY_PRICE_EUR}€
                    </span>
                    <span className="text-neutral-500 text-lg">/mês</span>
                  </div>
                </div>
                <p className="text-neutral-500 text-sm mb-8">
                  após o período de teste gratuito
                </p>

                {/* Feature list */}
                <div className="space-y-3 mb-10">
                  {FEATURES.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 group/feat"
                    >
                      <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 group-hover/feat:bg-amber-500/20 transition-colors">
                        <Check className="w-3 h-3 text-amber-500" />
                      </div>
                      <span className="text-sm text-neutral-300 group-hover/feat:text-white transition-colors duration-200">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  to="/auth/email"
                  className="group flex items-center justify-center w-full px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30"
                >
                  Começar 14 dias grátis
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
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

        {/* ── Included vs Not Included ── */}
        <section className="px-6 pb-24 relative">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[500px] h-[400px] bg-amber-500/3 rounded-full blur-[160px] pointer-events-none" />

          <div className="relative max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
                Transparência
              </p>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
                O que está incluído vs.{" "}
                <span className="text-neutral-500">o que não está</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Included */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 md:p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  </span>
                  Incluído
                </h3>
                <div className="space-y-3">
                  {INCLUDED.map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-sm text-neutral-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Not included */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 md:p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-neutral-700/50 flex items-center justify-center">
                    <Minus className="w-3.5 h-3.5 text-neutral-500" />
                  </span>
                  Não incluído
                </h3>
                <div className="space-y-3">
                  {NOT_INCLUDED.map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <Minus className="w-4 h-4 text-neutral-600 shrink-0" />
                      <span className="text-sm text-neutral-500">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
              <a
                href="https://wa.me/351912345678"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-black font-medium text-sm hover:bg-amber-400 transition-all hover:-translate-y-0.5 shadow-lg shadow-amber-500/20"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
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
