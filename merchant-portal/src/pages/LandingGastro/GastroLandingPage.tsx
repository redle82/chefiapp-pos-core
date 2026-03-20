/**
 * GastroLandingPage — Landing "Gastro Command 2027"
 * Visual do chefiapp-portal: #0A0C14, #F0EDE8, #E8192C, Fraunces/Space Grotesk/JetBrains Mono.
 * Rota: / (substitui OfficialLandingPage na raiz quando ativa).
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Star,
  Monitor,
  Tv2,
  Smartphone,
  BarChart3,
  Users,
  Zap,
  Check,
} from "lucide-react";

const tickerItems = [
  "TPV em tempo real",
  "KDS integrado",
  "AppStaff móvel",
  "Relatórios avançados",
  "Multi-localização",
  "Offline mode",
  "Gestão de equipa",
  "Análise de vendas",
];

const features = [
  {
    icon: <Monitor size={20} />,
    title: "TPV / POS",
    desc: "Terminal de ponto de venda cloud-native. Funciona offline, sincroniza em tempo real.",
    tag: "CORE",
  },
  {
    icon: <Tv2 size={20} />,
    title: "KDS — Kitchen Display",
    desc: "Ecrã de cozinha que elimina papel e acelera o serviço. Tickets por prioridade e zona.",
    tag: "CORE",
  },
  {
    icon: <Smartphone size={20} />,
    title: "AppStaff",
    desc: "App móvel para a equipa de sala. Pedidos, contas e comunicação na palma da mão.",
    tag: "CORE",
  },
  {
    icon: <BarChart3 size={20} />,
    title: "Analytics & Relatórios",
    desc: "Dashboards em tempo real. Vendas, performance da equipa, análise de menu.",
    tag: "ANALYSE",
  },
  {
    icon: <Users size={20} />,
    title: "Gestão de Equipa",
    desc: "Turnos, permissões por papel, convites e monitorização de performance.",
    tag: "GOVERN",
  },
  {
    icon: <Zap size={20} />,
    title: "Integrações",
    desc: "Conecta com delivery, sistemas de reservas, contabilidade e muito mais.",
    tag: "CONNECT",
  },
];

const segments = [
  {
    label: "Restaurante Fine Dining",
    desc: "Planta de sala, reservas, menu degustação e gestão de alérgenos.",
  },
  {
    label: "Gastrobar & Tapas",
    desc: "Pedidos rápidos, split de contas e integração com delivery.",
  },
  {
    label: "Café & Pastelaria",
    desc: "Fila de espera, fidelização e gestão de stock de ingredientes.",
  },
  {
    label: "Hotel & Resort",
    desc: "Multi-ponto de venda, integração PMS e room service.",
  },
  {
    label: "Food Truck",
    desc: "Modo offline, pagamentos móveis e relatórios por localização.",
  },
  {
    label: "Dark Kitchen",
    desc: "Gestão de múltiplas marcas, KDS por zona e análise de delivery.",
  },
];

const stats = [
  { value: 2800, suffix: "+", label: "Restaurantes activos" },
  { value: 47, suffix: "M+", label: "Pedidos processados" },
  { value: 99.9, suffix: "%", label: "Uptime garantido" },
  { value: 40, suffix: "%", label: "Redução no tempo de serviço" },
];

const testimonials = [
  {
    name: "Miguel Fernandes",
    role: "Proprietário · Sofia Gastrobar",
    text: "O ChefIApp transformou a nossa operação. A cozinha recebe os pedidos instantaneamente e o tempo de serviço baixou 40%.",
    stars: 5,
    metric: "−40% tempo de serviço",
  },
  {
    name: "Ana Rodrigues",
    role: "Directora de Operações · Grupo Alma",
    text: "Gerimos 4 restaurantes com uma única plataforma. Os relatórios consolidados dão-nos uma visão que nunca tínhamos tido.",
    stars: 5,
    metric: "4 restaurantes, 1 plataforma",
  },
  {
    name: "Carlos Moreno",
    role: "Chef Executivo · Sal & Brasa",
    text: "O KDS mudou a dinâmica da cozinha. Acabaram os bilhetes em papel e os erros de comunicação no pico de serviço.",
    stars: 5,
    metric: "0 erros de comunicação",
  },
];

const plans = [
  {
    name: "Starter",
    price: "49",
    period: "/mês",
    desc: "Para restaurantes que começam a digitalizar.",
    features: ["1 TPV incluído", "KDS básico", "Relatórios essenciais", "AppStaff (3 utilizadores)"],
    cta: "Começar grátis",
    popular: false,
  },
  {
    name: "Professional",
    price: "129",
    period: "/mês",
    desc: "Para restaurantes que querem crescer com dados.",
    features: ["3 TPVs incluídos", "KDS multi-zona", "Analytics avançado", "AppStaff ilimitado", "Integrações delivery"],
    cta: "Iniciar trial 14 dias",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Para grupos e multi-localização.",
    features: ["TPVs ilimitados", "Multi-localização", "API dedicada", "Account Manager", "Onboarding personalizado"],
    cta: "Falar com vendas",
    popular: false,
  },
];

const faqs = [
  {
    q: "O ChefIApp funciona sem internet?",
    a: "Sim. O modo offline garante que o TPV continua a funcionar mesmo sem ligação. Os dados sincronizam quando a ligação é restabelecida.",
  },
  {
    q: "Quanto tempo demora a instalação?",
    a: "A maioria dos restaurantes está operacional em menos de 2 horas. O onboarding guia-o passo a passo.",
  },
  {
    q: "Posso usar o meu hardware existente?",
    a: "Sim. O ChefIApp funciona em Mac, Windows, iPad e Android. Não há lock-in de hardware.",
  },
  {
    q: "Existe contrato de fidelização?",
    a: "Não. Todos os planos são mensais sem permanência. Pode cancelar a qualquer momento.",
  },
];

function CountUp({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          let s = 0;
          const step = end / (1500 / 16);
          const t = setInterval(() => {
            s += step;
            if (s >= end) {
              setCount(end);
              clearInterval(t);
            } else {
              setCount(Math.floor(s));
            }
          }, 16);
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);
  return (
    <span ref={ref}>
      {count.toLocaleString("pt-PT")}
      {suffix}
    </span>
  );
}

function RevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) el.classList.add("visible");
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

export function GastroLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeSegment, setActiveSegment] = useState(0);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div
      className="landing-gastro min-h-screen"
      style={{ background: "#0A0C14", color: "#F0EDE8" }}
    >
      {/* ── NAV ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(10,12,20,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
        }}
      >
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <Link to="/">
              <div className="flex items-center gap-2.5 cursor-pointer">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center"
                  style={{ background: "#E8192C" }}
                >
                  <span className="text-white font-bold text-sm font-display">
                    C
                  </span>
                </div>
                <span
                  className="font-semibold text-sm"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.12em",
                  }}
                >
                  CHEFIAPP™
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {["O Sistema", "Para quem", "Preços", "FAQ"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                  className="landing-nav-link text-sm"
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/auth/email">
                <span className="text-sm cursor-pointer landing-nav-link">
                  Entrar
                </span>
              </Link>
              <Link to="/auth/email">
                <span className="btn-primary text-sm py-2 px-5">
                  Ir para o sistema
                </span>
              </Link>
            </div>

            <button
              type="button"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ color: "rgba(240,237,232,0.7)" }}
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            className="md:hidden border-t"
            style={{
              background: "#0D0F1A",
              borderColor: "rgba(255,255,255,0.07)",
            }}
          >
            <div className="container py-4 flex flex-col gap-4">
              {["O Sistema", "Para quem", "Preços", "FAQ"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                  className="text-sm py-2"
                  style={{ color: "rgba(240,237,232,0.7)" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <Link to="/auth/email" onClick={() => setMobileMenuOpen(false)}>
                <span className="btn-primary block text-center mt-2">
                  Ir para o sistema
                </span>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(232,25,44,0.08) 0%, transparent 50%, rgba(10,12,20,0.95) 100%)",
          }}
        />

        <div className="container relative z-10">
          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              <div className="status-dot-live" />
              <span
                className="text-xs font-medium"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#22c55e",
                  letterSpacing: "0.1em",
                }}
              >
                CHEFIAPP OS · PRONTO PARA PRODUÇÃO
              </span>
            </div>

            <h1
              className="font-display mb-6 leading-[0.95]"
              style={{
                fontSize: "clamp(3rem,7vw,5.5rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              O sistema que gere o{" "}
              <span style={{ color: "#E8192C", fontStyle: "italic" }}>
                seu
              </span>
              <br />
              restaurante.
            </h1>

            <p
              className="text-lg mb-10 max-w-xl leading-relaxed"
              style={{
                color: "rgba(240,237,232,0.65)",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Uma única verdade. Sala, cozinha, bar e equipa no mesmo sistema —
              em tempo real. TPV, KDS, AppStaff e relatórios feitos para quem
              cuida de cada detalhe.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link to="/auth/email">
                <span className="btn-primary text-base px-8 py-4">
                  Começar trial gratuito <ArrowRight size={16} />
                </span>
              </Link>
              <Link to="/op/tpv?mode=trial">
                <span className="btn-ghost text-base px-8 py-4">
                  Ver o sistema
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-6 mt-10">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={14} fill="#E8192C" color="#E8192C" />
                ))}
                <span
                  className="text-sm ml-1"
                  style={{ color: "rgba(240,237,232,0.5)" }}
                >
                  4.9/5
                </span>
              </div>
              <div
                className="h-4 w-px"
                style={{ background: "rgba(255,255,255,0.1)" }}
              />
              <span
                className="text-sm"
                style={{ color: "rgba(240,237,232,0.5)" }}
              >
                Sem contrato · Cancela quando quiser
              </span>
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40"
          aria-hidden
        >
          <span
            className="text-xs"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.1em",
            }}
          >
            SCROLL
          </span>
          <ChevronDown size={16} className="animate-bounce" />
        </div>
      </section>

      {/* ── TICKER ── */}
      <div
        className="py-5 overflow-hidden border-y"
        style={{
          borderColor: "rgba(255,255,255,0.06)",
          background: "rgba(15,17,32,0.5)",
        }}
      >
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-6 px-8 whitespace-nowrap"
            >
              <span
                className="text-sm"
                style={{
                  color: "rgba(240,237,232,0.5)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {item}
              </span>
              <span style={{ color: "#E8192C", fontSize: "6px" }}>●</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section className="py-20" id="estatisticas">
        <div className="container">
          <RevealSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s, i) => (
                <div key={i} className="stat-card text-center">
                  <div
                    className="font-display text-4xl md:text-5xl font-bold mb-2"
                    style={{ color: "#E8192C" }}
                  >
                    <CountUp end={s.value} suffix={s.suffix} />
                  </div>
                  <div
                    className="text-sm"
                    style={{ color: "rgba(240,237,232,0.5)" }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20" id="o-sistema">
        <div className="container">
          <RevealSection>
            <div className="mb-12">
              <div className="section-label mb-3">PLATAFORMA COMPLETA</div>
              <h2
                className="font-display text-4xl md:text-5xl font-bold leading-tight"
                style={{ letterSpacing: "-0.02em" }}
              >
                Tudo o que o seu restaurante{" "}
                <span style={{ color: "#E8192C", fontStyle: "italic" }}>
                  precisa
                </span>
                , numa só plataforma.
              </h2>
            </div>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <RevealSection key={i}>
                <div
                  className="glass-card p-6 h-full group transition-all duration-300"
                  style={{
                    border: "1px solid rgba(255,255,255,0.07)",
                    minHeight: "160px",
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="feature-icon group-hover:scale-110 transition-transform duration-300">
                      {f.icon}
                    </div>
                    <span className="badge-beta">{f.tag}</span>
                  </div>
                  <h3
                    className="font-semibold text-base mb-2"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "rgba(240,237,232,0.5)" }}
                  >
                    {f.desc}
                  </p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section className="pb-20">
        <div className="container">
          <RevealSection>
            <Link to="/op/tpv?mode=trial">
              <div
                className="relative rounded-2xl overflow-hidden block"
                style={{
                  border: "1px solid rgba(232,25,44,0.15)",
                  background:
                    "linear-gradient(135deg, rgba(232,25,44,0.08) 0%, rgba(15,17,32,0.95) 100%)",
                  minHeight: 280,
                }}
              >
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(10,12,20,0.9) 0%, transparent 50%)",
                  }}
                >
                  <div className="section-label mb-2">LIVE PREVIEW</div>
                  <div
                    className="font-display text-2xl md:text-3xl font-bold mb-4"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    Command Centre — ChefIApp OS
                  </div>
                  <span className="btn-primary text-sm py-2 px-4 inline-flex">
                    Explorar demo <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          </RevealSection>
        </div>
      </section>

      {/* ── PARA QUEM (SEGMENTOS) ── */}
      <section
        className="py-20"
        id="para-quem"
        style={{ background: "rgba(15,17,32,0.4)" }}
      >
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <div className="section-label mb-3">PARA QUEM</div>
              <h2
                className="font-display text-4xl font-bold mb-8 leading-tight"
                style={{ letterSpacing: "-0.02em" }}
              >
                Construído para cada tipo de restaurante.
              </h2>
              <div className="space-y-2">
                {segments.map((seg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveSegment(i)}
                    className="w-full text-left p-4 rounded-lg transition-all duration-200"
                    style={{
                      background:
                        activeSegment === i
                          ? "rgba(232,25,44,0.1)"
                          : "transparent",
                      border: `1px solid ${
                        activeSegment === i
                          ? "rgba(232,25,44,0.3)"
                          : "transparent"
                      }`,
                      borderLeft: `3px solid ${
                        activeSegment === i ? "#E8192C" : "transparent"
                      }`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="font-medium text-sm"
                        style={{
                          color:
                            activeSegment === i
                              ? "#F0EDE8"
                              : "rgba(240,237,232,0.5)",
                        }}
                      >
                        {seg.label}
                      </span>
                      <ChevronRight
                        size={14}
                        style={{
                          color:
                            activeSegment === i ? "#E8192C" : "transparent",
                        }}
                      />
                    </div>
                    {activeSegment === i && (
                      <p
                        className="text-sm mt-2"
                        style={{ color: "rgba(240,237,232,0.6)" }}
                      >
                        {seg.desc}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </RevealSection>

            <RevealSection>
              <div
                className="rounded-2xl p-8 flex flex-col justify-center"
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.02)",
                  minHeight: 320,
                }}
              >
                <div className="section-label mb-2">ECOSISTEMA</div>
                <div
                  className="font-display text-xl font-semibold mb-6"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  TPV · KDS · AppStaff · Admin
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(240,237,232,0.6)" }}
                >
                  Um único sistema para sala, cozinha, bar e gestão. Sincronização
                  em tempo real, relatórios consolidados e equipa alinhada.
                </p>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section
        className="py-20"
        id="testemunhos"
        style={{ background: "rgba(15,17,32,0.5)" }}
      >
        <div className="container">
          <RevealSection>
            <div className="text-center mb-12">
              <div className="section-label mb-3">TESTEMUNHOS</div>
              <h2
                className="font-display text-4xl font-bold"
                style={{ letterSpacing: "-0.02em" }}
              >
                Os restaurantes que já confiam no ChefIApp.
              </h2>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <RevealSection key={i}>
                <div className="glass-card p-6 h-full flex flex-col">
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={12} fill="#E8192C" color="#E8192C" />
                    ))}
                  </div>
                  <blockquote
                    className="text-sm leading-relaxed mb-6 flex-1"
                    style={{
                      color: "rgba(240,237,232,0.7)",
                      fontStyle: "italic",
                    }}
                  >
                    "{t.text}"
                  </blockquote>
                  <div
                    className="flex items-center justify-between pt-4"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: "rgba(240,237,232,0.4)" }}
                      >
                        {t.role}
                      </div>
                    </div>
                    <div
                      className="text-xs font-bold"
                      style={{
                        color: "#E8192C",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {t.metric}
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-20" id="preços">
        <div className="container">
          <RevealSection>
            <div className="text-center mb-12">
              <div className="section-label mb-3">PREÇOS</div>
              <h2
                className="font-display text-4xl font-bold mb-4"
                style={{ letterSpacing: "-0.02em" }}
              >
                Simples. Transparente. Sem surpresas.
              </h2>
              <p
                className="text-base"
                style={{ color: "rgba(240,237,232,0.5)" }}
              >
                14 dias de trial gratuito. Sem cartão de crédito.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <RevealSection key={i}>
                <div
                  className={`glass-card p-6 h-full flex flex-col ${plan.popular ? "pricing-card-popular" : ""}`}
                  style={{
                    border: `1px solid ${plan.popular ? "rgba(232,25,44,0.3)" : "rgba(255,255,255,0.07)"}`,
                  }}
                >
                  <div className="mb-6">
                    <div
                      className="font-semibold text-sm mb-1"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "rgba(240,237,232,0.5)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {plan.name.toUpperCase()}
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      {plan.price === "Custom" ? (
                        <span className="font-display text-3xl font-bold">
                          Custom
                        </span>
                      ) : (
                        <>
                          <span className="font-display text-4xl font-bold">
                            €{plan.price}
                          </span>
                          <span
                            className="text-sm"
                            style={{ color: "rgba(240,237,232,0.4)" }}
                          >
                            {plan.period}
                          </span>
                        </>
                      )}
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: "rgba(240,237,232,0.5)" }}
                    >
                      {plan.desc}
                    </p>
                  </div>
                  <div className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-2.5">
                        <Check
                          size={14}
                          style={{ color: "#E8192C", flexShrink: 0 }}
                        />
                        <span
                          className="text-sm"
                          style={{ color: "rgba(240,237,232,0.7)" }}
                        >
                          {f}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Link to="/auth/email">
                    <span
                      className={`block text-center ${plan.popular ? "btn-primary" : "btn-ghost"}`}
                    >
                      {plan.cta}
                    </span>
                  </Link>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section
        className="py-20"
        id="faq"
        style={{ background: "rgba(15,17,32,0.3)" }}
      >
        <div className="container max-w-3xl">
          <RevealSection>
            <div className="text-center mb-12">
              <div className="section-label mb-3">FAQ</div>
              <h2
                className="font-display text-4xl font-bold"
                style={{ letterSpacing: "-0.02em" }}
              >
                Perguntas frequentes.
              </h2>
            </div>
          </RevealSection>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <RevealSection key={i}>
                <div
                  className="glass-card overflow-hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-medium text-sm pr-4">{faq.q}</span>
                    <ChevronDown
                      size={16}
                      style={{
                        color: "#E8192C",
                        transform: activeFaq === i ? "rotate(180deg)" : "rotate(0)",
                        transition: "transform 0.2s ease",
                        flexShrink: 0,
                      }}
                    />
                  </button>
                  {activeFaq === i && (
                    <div
                      className="px-5 pb-5 text-sm leading-relaxed"
                      style={{
                        color: "rgba(240,237,232,0.6)",
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div className="pt-4">{faq.a}</div>
                    </div>
                  )}
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="container">
          <RevealSection>
            <div
              className="relative rounded-2xl overflow-hidden text-center p-16"
              style={{
                background:
                  "linear-gradient(135deg, rgba(232,25,44,0.15) 0%, rgba(15,17,32,0.8) 100%)",
                border: "1px solid rgba(232,25,44,0.2)",
              }}
            >
              <div className="section-label mb-4">COMECE HOJE</div>
              <h2
                className="font-display text-4xl md:text-5xl font-bold mb-6"
                style={{ letterSpacing: "-0.02em" }}
              >
                O seu restaurante merece{" "}
                <span style={{ color: "#E8192C", fontStyle: "italic" }}>
                  o melhor sistema.
                </span>
              </h2>
              <p
                className="text-base mb-10 max-w-xl mx-auto"
                style={{ color: "rgba(240,237,232,0.6)" }}
              >
                14 dias de trial gratuito. Sem cartão de crédito. Sem contrato.
                Cancela quando quiser.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to="/auth/email">
                  <span className="btn-primary text-base px-10 py-4">
                    Começar agora <ArrowRight size={16} />
                  </span>
                </Link>
                <Link to="/op/tpv?mode=trial">
                  <span className="btn-ghost text-base px-10 py-4">
                    Ver demo ao vivo
                  </span>
                </Link>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="py-12 border-t"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ background: "#E8192C" }}
                >
                  <span className="text-white font-bold text-xs font-display">
                    C
                  </span>
                </div>
                <span
                  className="font-semibold text-sm"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.12em",
                  }}
                >
                  CHEFIAPP™
                </span>
              </div>
              <p
                className="text-sm"
                style={{ color: "rgba(240,237,232,0.4)" }}
              >
                O sistema operativo completo para restaurantes modernos.
              </p>
            </div>
            {[
              {
                title: "Produto",
                items: ["TPV / POS", "KDS", "AppStaff", "Analytics", "Integrações"],
              },
              {
                title: "Suporte",
                items: ["Documentação", "Status", "Contacto", "Termos"],
              },
            ].map((col, i) => (
              <div key={i}>
                <div
                  className="text-xs font-semibold mb-4 tracking-widest uppercase"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "rgba(240,237,232,0.3)",
                  }}
                >
                  {col.title}
                </div>
                <div className="space-y-2.5">
                  {col.items.map((item, j) => (
                    <div key={j}>
                      <a
                        href="#"
                        className="text-sm transition-colors"
                        style={{ color: "rgba(240,237,232,0.5)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#F0EDE8")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "rgba(240,237,232,0.5)")
                        }
                      >
                        {item}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            className="flex flex-col md:flex-row items-center justify-between pt-8"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              className="text-xs mb-4 md:mb-0"
              style={{
                color: "rgba(240,237,232,0.3)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              © 2027 ChefIApp™ · Todos os direitos reservados
            </div>
            <div className="flex items-center gap-2">
              <div className="status-dot-live" />
              <span
                className="text-xs"
                style={{
                  color: "rgba(240,237,232,0.3)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Sistema operacional do restaurante
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
