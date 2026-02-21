/**
 * Sobre / Company — Página pública institucional.
 * Quem somos, missão, equipa, visão do ChefIApp™ OS.
 * Rota: /about
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";

const META_TITLE = "Sobre nós | ChefIApp™ OS";
const META_DESCRIPTION =
  "Conheça a equipa e a missão por trás do ChefIApp™ OS — o sistema operativo soberano para restauração.";

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

const VALUES = [
  {
    icon: "🏛️",
    title: "Soberania",
    desc: "O restaurante é dono dos seus dados. Sem lock-in, sem dependências ocultas. O ChefIApp™ OS é a infraestrutura — o controlo é seu.",
  },
  {
    icon: "⚡",
    title: "Simplicidade operacional",
    desc: "Liga → Funciona → Opera. Sem configurações desnecessárias, sem curvas de aprendizagem. Cada ecrã tem um propósito claro.",
  },
  {
    icon: "🔒",
    title: "Confiança técnica",
    desc: "Sem promessas que não possamos cumprir. Cada afirmação é verificável. Transparência em segurança, dados e infraestrutura.",
  },
  {
    icon: "🚀",
    title: "Inovação prática",
    desc: "Modularidade real: TPV, KDS, AppStaff, integrações — tudo se liga. Construímos o que os restaurantes precisam, não o que soa bem num pitch.",
  },
];

const MILESTONES = [
  { year: "2024", event: "Início do desenvolvimento — Core Engine v1" },
  { year: "2024", event: "Primeiro restaurante piloto em Lisboa" },
  { year: "2025", event: "Lançamento do TPV, KDS e AppStaff" },
  {
    year: "2025",
    event: "Sistema de integrações modulares (Stripe, WhatsApp, Delivery)",
  },
  { year: "2025", event: "Multi-tenant e billing SaaS operacional" },
];

export function AboutPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = META_TITLE;
    setMeta("description", META_DESCRIPTION);
    setMeta("og:title", META_TITLE, true);
    setMeta("og:description", META_DESCRIPTION, true);
    setMeta("og:type", "website", true);
    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* ── Header ── */}
      <header className="border-b border-white/5 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/landing-v2" className="flex items-center gap-2">
            <img
              src="/logo-chefiapp-clean.png"
              alt="ChefIApp"
              className="w-6 h-6 rounded"
            />
            <span className="text-sm font-semibold text-white">ChefIApp</span>
          </Link>
          <Link
            to="/auth/phone"
            className="text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors"
          >
            Testar grátis
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <p className="text-amber-500/90 text-sm font-medium uppercase tracking-wider mb-4">
          Sobre nós
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          O sistema operativo para restauração
        </h1>
        <p className="text-neutral-400 text-lg mb-12 leading-relaxed">
          O ChefIApp™ OS nasceu de uma convicção simples: os restaurantes
          merecem tecnologia que respeite a sua autonomia. Não somos mais um
          SaaS genérico — somos a infraestrutura soberana que liga caixa,
          cozinha, equipa e cliente num só sistema.
        </p>

        {/* ── Missão ── */}
        <section className="mb-14">
          <h2 className="text-2xl font-semibold text-white mb-4">Missão</h2>
          <div className="border border-white/5 rounded-xl bg-white/[0.02] p-6">
            <p className="text-neutral-300 leading-relaxed text-lg">
              Dar a cada restaurante — do café de bairro à cadeia de franquias —
              um sistema operacional completo, modular e soberano. Sem
              dependências ocultas, sem dados aprisionados, sem intermediários
              desnecessários.
            </p>
          </div>
        </section>

        {/* ── Valores ── */}
        <section className="mb-14">
          <h2 className="text-2xl font-semibold text-white mb-6">
            O que nos guia
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="border border-white/5 rounded-xl bg-white/[0.02] p-5"
              >
                <div className="text-2xl mb-3">{v.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {v.title}
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── O que construímos ── */}
        <section className="mb-14">
          <h2 className="text-2xl font-semibold text-white mb-4">
            O que construímos
          </h2>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            O ChefIApp™ OS é composto por módulos independentes que se ligam de
            forma nativa:
          </p>
          <ul className="space-y-3">
            {[
              ["TPV", "Ponto de venda completo — balcão, mesas, pagamentos."],
              [
                "KDS",
                "Kitchen Display System — cozinha organizada em tempo real.",
              ],
              [
                "AppStaff",
                "App da equipa — tarefas, turnos, comunicação, gamificação.",
              ],
              [
                "Integration Hub",
                "Stripe, WhatsApp, Delivery, Webhooks — tudo plugável.",
              ],
              [
                "Admin Dashboard",
                "Configuração, relatórios, catálogo, dispositivos, billing.",
              ],
              [
                "Public Web",
                "Página pública do restaurante com menu e QR ordering.",
              ],
            ].map(([name, desc]) => (
              <li key={name} className="flex gap-3 items-start">
                <span className="text-emerald-500 mt-1 shrink-0">●</span>
                <div>
                  <span className="text-white font-medium">{name}</span>{" "}
                  <span className="text-neutral-400">— {desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Timeline ── */}
        <section className="mb-14">
          <h2 className="text-2xl font-semibold text-white mb-6">Cronologia</h2>
          <div className="space-y-4 border-l-2 border-white/10 pl-6">
            {MILESTONES.map((m, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-amber-500/80 border-2 border-neutral-950" />
                <p className="text-amber-500/80 text-xs font-medium uppercase tracking-wider mb-1">
                  {m.year}
                </p>
                <p className="text-neutral-300 text-sm">{m.event}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Equipa ── */}
        <section className="mb-14">
          <h2 className="text-2xl font-semibold text-white mb-4">Equipa</h2>
          <p className="text-neutral-400 leading-relaxed">
            O ChefIApp™ OS é construído por{" "}
            <a
              href="https://goldmonkey.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 hover:text-amber-400 underline"
            >
              goldmonkey.studio
            </a>{" "}
            — um estúdio de engenharia focado em criar experiências digitais
            extraordinárias que combinam tecnologia de ponta, design impecável e
            execução cirúrgica. Baseados em Lisboa, mas a construir para o
            mundo.
          </p>
        </section>

        {/* ── CTA ── */}
        <section className="border border-white/5 rounded-xl bg-white/[0.02] p-6 text-center mb-14">
          <h2 className="text-xl font-semibold text-white mb-3">
            Pronto para experimentar?
          </h2>
          <p className="text-neutral-400 text-sm mb-5">
            Comece hoje — sem compromisso, sem cartão de crédito.
          </p>
          <Link
            to="/auth/phone"
            className="inline-block px-6 py-2.5 bg-amber-500 text-neutral-950 font-semibold rounded-lg hover:bg-amber-400 transition-colors text-sm"
          >
            Começar grátis
          </Link>
        </section>

        {/* ── Nav ── */}
        <nav className="pt-8 border-t border-white/5 flex flex-wrap gap-4">
          <Link
            to="/security"
            className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
          >
            Segurança e dados
          </Link>
          <Link
            to="/changelog"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Changelog
          </Link>
          <Link
            to="/status"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Status
          </Link>
          <Link
            to="/legal/privacy"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Privacidade
          </Link>
          <Link
            to="/landing-v2"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            ← Voltar à landing
          </Link>
        </nav>
      </article>

      <MadeWithLoveFooter variant="default" />
    </main>
  );
}
