/**
 * Changelog — O que mudou. Página pública, só itens reais em produção.
 * Contrato: [TECNICAS_AVANCADAS_SILICON_VALLEY.md] — confiança técnica sem marketing.
 * Rota: /changelog
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";

const META_TITLE = "Changelog | ChefIApp™ OS — O que mudou";
const META_DESCRIPTION =
  "Actualizações reais do ChefIApp™ OS: TPV, KDS, turnos, caixa, menu, Staff App e mais. Só o que está em produção.";

/** Itens reais já em produção. Ordem: mais recente primeiro. */
const CHANGELOG_ENTRIES: {
  date: string;
  title: string;
  description: string;
}[] = [
  {
    date: "Fev 2026",
    title: "Blog TPV para restaurantes",
    description:
      "Página pública /blog e /blog/tpv-restaurantes com artigo honesto sobre TPV, POS e o que o ChefIApp oferece hoje. SEO e JSON-LD Article.",
  },
  {
    date: "Fev 2026",
    title: "Landing V2 em três idiomas",
    description:
      "Landing com locale pt, en, es (query ?lang=). Bandeira Brasil + setor de idioma no navbar. Copy completa em português, inglês e espanhol.",
  },
  {
    date: "Fev 2026",
    title: "Changelog público",
    description: "Esta página. Lista de alterações reais, sem marketing.",
  },
  {
    date: "2025",
    title: "TPV operacional — split bill",
    description:
      "Pagamento parcial por pedido (split bill). Modal de pagamento com suporte a múltiplos pagamentos até cobrir o total.",
  },
  {
    date: "2025",
    title: "TPV — mapa de mesas e turnos",
    description:
      "Criação de pedidos por mesa, navegação mesas/pedidos. Abertura e fecho de caixa (gerente). Turnos ligados à sessão; impossível fechar caixa com pedidos em aberto.",
  },
  {
    date: "2025",
    title: "KDS integrado ao TPV",
    description:
      "Pedidos em tempo real na cozinha/bar. Estados em preparação e pronto. Indicadores de atraso e tarefas operacionais.",
  },
  {
    date: "2025",
    title: "Menu Builder e catálogo",
    description:
      "Produtos e categorias por restaurante. Ligação ao TPV, KDS e página pública do restaurante.",
  },
  {
    date: "2025",
    title: "Staff App (mini-TPV e turnos)",
    description:
      "App de equipa com visibilidade de pedidos e tarefas. Mini-TPV em contexto (ex.: esplanada). Turnos e check-in.",
  },
  {
    date: "2025",
    title: "Reservas e mapa de mesas",
    description:
      "Gestão de reservas e mapa de mesas no mesmo sistema que o TPV.",
  },
  {
    date: "2025",
    title: "Página pública do restaurante",
    description:
      "Menu e pedidos online por restaurante (/public/:slug). Mesmos dados do catálogo e do TPV.",
  },
];

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

export function ChangelogPage() {
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

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <p className="text-amber-500/90 text-sm font-medium uppercase tracking-wider mb-4">
          Changelog
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          O que mudou
        </h1>
        <p className="text-neutral-400 text-lg mb-12">
          Actualizações reais do ChefIApp™ OS. Só o que está em produção — sem
          roadmap nem promessas.
        </p>

        <ul className="space-y-10">
          {CHANGELOG_ENTRIES.map((entry, i) => (
            <li key={i} className="border-b border-white/5 pb-10 last:border-0">
              <span className="text-xs text-neutral-500 uppercase tracking-wide">
                {entry.date}
              </span>
              <h2 className="text-xl font-semibold text-white mt-2 mb-1">
                {entry.title}
              </h2>
              <p className="text-neutral-400 leading-relaxed">
                {entry.description}
              </p>
            </li>
          ))}
        </ul>

        <nav className="mt-14 pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4">
          <Link
            to="/landing-v2"
            className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
          >
            ← Voltar à landing
          </Link>
          <Link
            to="/blog/tpv-restaurantes"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Blog TPV →
          </Link>
        </nav>
      </article>

      <MadeWithLoveFooter variant="default" />
    </main>
  );
}
