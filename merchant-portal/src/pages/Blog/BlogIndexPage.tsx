/**
 * Blog Index — Lista todos os artigos do blog ChefIApp.
 * Grid responsivo: 1 col mobile, 2 col tablet, 3 col desktop.
 * SEO: meta tags + JSON-LD CollectionPage.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";

const META_TITLE = "Blog ChefIApp | Artigos sobre Gestao de Restaurantes e POS";
const META_DESCRIPTION =
  "Artigos sobre gestao de restaurantes, tecnologia POS, compliance fiscal, operacoes de cozinha e muito mais. Guias praticos para donos de restaurantes.";
const CANONICAL_URL = "https://chefiapp.com/blog";

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

/* ---------- Article data ---------- */

interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
}

const ARTICLES: BlogArticle[] = [
  {
    slug: "/blog/tpv-restaurantes",
    title: "TPV para Restaurantes: O Guia Completo",
    excerpt:
      "Tudo o que precisa saber sobre terminais de ponto de venda para restaurantes. Desde funcionalidades essenciais ate integracao com cozinha, pagamentos e turnos.",
    category: "Tecnologia",
    date: "2026-01-15",
  },
  {
    slug: "/blog/tpv-vs-pos-fiscal",
    title: "TPV vs POS Fiscal: Qual a Diferenca?",
    excerpt:
      "Entenda as diferencas entre um TPV operacional e um POS fiscal certificado. Quando precisa de cada um e como o ChefIApp combina ambos.",
    category: "Negocio",
    date: "2026-01-22",
  },
  {
    slug: "/blog/quando-abrir-fechar-caixa",
    title: "Quando Abrir e Fechar a Caixa do Restaurante",
    excerpt:
      "Guia pratico sobre gestao de turnos e caixa. Aprenda as melhores praticas para abertura, fecho e reconciliacao de caixa no seu restaurante.",
    category: "Operacoes",
    date: "2026-02-03",
  },
  {
    slug: "/blog/chefiapp-vs-concorrencia",
    title: "ChefIApp vs Concorrencia: Comparacao Completa 2026",
    excerpt:
      "Comparacao detalhada entre ChefIApp e os principais sistemas POS do mercado. Precos, funcionalidades, suporte e roadmap lado a lado.",
    category: "Comparacao",
    date: "2026-02-10",
  },
  {
    slug: "/blog/como-escolher-pos",
    title: "Como Escolher o Melhor Sistema POS para o Seu Restaurante",
    excerpt:
      "Checklist completo para escolher o sistema POS ideal. Criterios de avaliacao, perguntas a fazer e erros comuns a evitar na decisao.",
    category: "Guia",
    date: "2026-02-18",
  },
  {
    slug: "/blog/gestao-cozinha-kds",
    title: "Gestao de Cozinha com KDS: Do Caos a Eficiencia",
    excerpt:
      "Como um Kitchen Display System transforma a operacao da cozinha. Reducao de erros, tempos de preparacao e comunicacao em tempo real entre sala e cozinha.",
    category: "Operacoes",
    date: "2026-03-01",
  },
  {
    slug: "/blog/compliance-fiscal-pt-es",
    title: "Compliance Fiscal para Restaurantes em Portugal e Espanha",
    excerpt:
      "Requisitos legais de faturacao, certificacao AT e TicketBAI. O que o seu restaurante precisa para estar em conformidade fiscal na Peninsula Iberica.",
    category: "Legal/Fiscal",
    date: "2026-03-10",
  },
];

/* ---------- Helpers ---------- */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ---------- Component ---------- */

export function BlogIndexPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = META_TITLE;
    setMeta("description", META_DESCRIPTION);
    setMeta(
      "keywords",
      "blog restaurante, POS restaurante, TPV, gestao restaurante, compliance fiscal, KDS, cozinha, sistema ponto de venda",
    );
    setMeta("og:title", META_TITLE, true);
    setMeta("og:description", META_DESCRIPTION, true);
    setMeta("og:type", "website", true);
    setMeta("og:url", CANONICAL_URL, true);

    let linkCanonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.rel = "canonical";
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.href = CANONICAL_URL;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: META_TITLE,
      description: META_DESCRIPTION,
      url: CANONICAL_URL,
      publisher: { "@type": "Organization", name: "ChefIApp" },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: ARTICLES.map((a, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `https://chefiapp.com${a.slug}`,
          name: a.title,
        })),
      },
    };
    let scriptJsonLd = document.getElementById(
      "blog-index-jsonld",
    ) as HTMLScriptElement | null;
    if (!scriptJsonLd) {
      scriptJsonLd = document.createElement("script");
      scriptJsonLd.id = "blog-index-jsonld";
      scriptJsonLd.type = "application/ld+json";
      document.head.appendChild(scriptJsonLd);
    }
    scriptJsonLd.textContent = JSON.stringify(jsonLd);

    return () => {
      document.title = prevTitle;
      scriptJsonLd?.remove();
    };
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header minimo */}
      <header className="border-b border-white/5 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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
            Testar gratis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 md:pt-20 md:pb-14">
        <p className="text-amber-500/90 text-sm font-medium uppercase tracking-wider mb-4">
          Blog
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Blog ChefIApp
        </h1>
        <p className="text-neutral-400 text-lg max-w-2xl">
          Artigos sobre gestao de restaurantes, tecnologia POS, e operacoes.
          Guias praticos escritos por quem constroi o sistema.
        </p>
      </section>

      {/* Article grid */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ARTICLES.map((article) => (
            <Link
              key={article.slug}
              to={article.slug}
              className="group block rounded-xl border border-white/5 bg-neutral-900/60 hover:bg-neutral-900 transition-colors p-6"
            >
              {/* Category badge */}
              <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full mb-4">
                {article.category}
              </span>

              {/* Title */}
              <h2 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors mb-3 line-clamp-2">
                {article.title}
              </h2>

              {/* Excerpt */}
              <p className="text-sm text-neutral-400 leading-relaxed mb-4 line-clamp-3">
                {article.excerpt}
              </p>

              {/* Footer: date + link */}
              <div className="flex items-center justify-between mt-auto">
                <time
                  dateTime={article.date}
                  className="text-xs text-neutral-500"
                >
                  {formatDate(article.date)}
                </time>
                <span className="text-sm font-medium text-amber-500 group-hover:text-amber-400 transition-colors">
                  Ler artigo &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Pronto para modernizar o seu restaurante?
          </h2>
          <p className="text-neutral-400 mb-6">
            Experimente o ChefIApp gratuitamente. Sem cartao, sem compromisso.
          </p>
          <Link
            to="/auth/phone"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Comecar gratis
          </Link>
        </div>
      </section>

      <MadeWithLoveFooter />
    </main>
  );
}
