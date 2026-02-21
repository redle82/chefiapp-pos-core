/**
 * Blog: TPV para Restaurantes — Página pública SEO.
 * Contrato: só expor o que existe no código. Vender TPV de alto nível sem mentiras.
 * Rotas: /blog, /blog/tpv-restaurantes (mesmo conteúdo para maximizar descoberta).
 * Long-tail (título + 1.º parágrafo): TPV, ponto de venda, sistema para restaurante, POS, software gestão restaurante.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";

const META_TITLE = "TPV para Restaurantes | Sistema Operacional — ChefIApp™ OS";
const META_DESCRIPTION =
  "Sistema operacional para restaurantes: mesas, pedidos, pagamentos, turnos e caixa numa única verdade. O que os grandes players fazem e o que o ChefIApp™ OS oferece hoje — sem mentiras.";

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

const CANONICAL_URL = "https://chefiapp.com/blog/tpv-restaurantes";

export function BlogTPVRestaurantesPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = META_TITLE;
    setMeta("description", META_DESCRIPTION);
    setMeta(
      "keywords",
      "TPV, ponto de venda, restaurantes, POS, point of sale, sistema restaurante, caixa restaurante, software TPV, TPV restaurante, gestão restaurante",
    );
    setMeta("og:title", META_TITLE, true);
    setMeta("og:description", META_DESCRIPTION, true);
    setMeta("og:type", "article", true);
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
      "@type": "Article",
      headline: META_TITLE,
      description: META_DESCRIPTION,
      url: CANONICAL_URL,
      publisher: { "@type": "Organization", name: "ChefIApp" },
    };
    let scriptJsonLd = document.getElementById(
      "blog-article-jsonld",
    ) as HTMLScriptElement | null;
    if (!scriptJsonLd) {
      scriptJsonLd = document.createElement("script");
      scriptJsonLd.id = "blog-article-jsonld";
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
      {/* Header mínimo */}
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
          Blog · TPV e Restaurantes
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          TPV para restaurantes: o que os grandes players fazem e o que podemos
          vender hoje
        </h1>
        <p className="text-neutral-400 text-lg mb-10">
          Quem procura “TPV”, “ponto de venda”, “sistema para restaurante” ou
          “POS” em qualquer parte do mundo precisa encontrar soluções reais.
          Este texto descreve o que é um TPV operacional, o que o mercado
          oferece e, com total transparência, o que o ChefIApp™ OS já entrega
          hoje — sem promessas que o código ainda não cumpre.
        </p>

        <section className="prose prose-invert prose-amber max-w-none mb-14">
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            O que é um TPV (ponto de venda) para restaurantes?
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Um TPV — terminal ou sistema de ponto de venda — é o centro da
            operação de vendas: onde se registam pedidos, se associam a mesas ou
            clientes, se aplicam descontos e se processam pagamentos. Em
            restaurantes, um bom TPV liga mesa → pedido → cozinha (KDS) →
            pagamento e caixa, em vez de várias ferramentas desconectadas.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            O que os grandes players fazem (Square, Toast, Lightspeed, etc.)
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Os líderes do mercado oferecem TPV físico e/ou em tablet, gestão de
            mesas, pedidos em tempo real, integração com cozinha (KDS),
            pagamentos integrados, relatórios e, em muitos casos, reservas e
            delivery. O padrão é: um único ecossistema para sala, cozinha, bar e
            caixa, com dados em tempo real e menos “colagem” de sistemas.
          </p>
          <p className="text-neutral-300 leading-relaxed mb-4">
            O ChefIApp™ OS segue essa mesma ideia: um sistema operacional para o
            restaurante, não um POS fiscal isolado. O que descrevemos abaixo é o
            que está implementado e em uso hoje.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            O que o ChefIApp™ OS oferece hoje (sem mentiras)
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Tudo o que se segue existe no produto e no código. Nada é roadmap
            nem “em breve” disfarçado de realidade.
          </p>
          <ul className="list-disc pl-6 text-neutral-300 space-y-2 mb-6">
            <li>
              <strong>TPV operacional</strong>: fluxo mesa → pedido → pagar.
              Desbloqueio por turno (start_turn), caixa aberta obrigatória para
              criar vendas, gestão de pedidos em aberto.
            </li>
            <li>
              <strong>Mapa de mesas</strong>: mesas do Core, criação de pedido
              por mesa, navegação entre mesas, pedidos e reservas.
            </li>
            <li>
              <strong>Pagamentos</strong>: modal de pagamento por pedido,
              suporte a pagamento parcial (split bill), integração com motor de
              pagamento. Emissão fiscal quando o total está pago (conforme
              configuração).
            </li>
            <li>
              <strong>Caixa e turnos</strong>: abertura e fecho de caixa (com
              permissão de gerente), turnos ligados à sessão. Impossível fechar
              caixa com pedidos em aberto.
            </li>
            <li>
              <strong>Menu dinâmico</strong>: menu por restaurante e modo (TPV),
              categorias e produtos, usado no TPV e no resto do sistema.
            </li>
            <li>
              <strong>KDS (Cozinha)</strong>: pedidos em tempo real na cozinha,
              estados (em preparação, pronto), integrado ao mesmo fluxo do TPV.
            </li>
            <li>
              <strong>Staff App</strong>: mini-TPV e gestão de turnos para a
              equipa, mesma verdade operacional (mesmo cérebro que o TPV e o
              KDS).
            </li>
            <li>
              <strong>Reservas e sala</strong>: gestão de reservas e mapa de
              mesas no mesmo sistema.
            </li>
            <li>
              <strong>Multi-idioma</strong>: interface e landing em português,
              inglês e espanhol.
            </li>
            <li>
              <strong>Funciona no browser</strong>: tablet, computador ou
              telemóvel; sem hardware proprietário obrigatório. Impressoras
              térmicas ESC/POS suportadas.
            </li>
          </ul>
          <p className="text-neutral-400 text-sm italic mb-8">
            O ChefIApp™ não substitui o POS fiscal: trabalha em paralelo. A
            certificação fiscal própria está prevista para mais tarde; até lá, o
            TPV operacional e o POS fiscal coexistem.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Preço e trial
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Um único plano com TPV, KDS, Menu Builder, Staff App, reservas,
            analytics operacionais, controle de stock, página pública do
            restaurante e suporte por WhatsApp. 14 dias grátis, sem cartão, sem
            contrato. Depois do trial, preço único por mês, sem módulos
            escondidos.
          </p>
        </section>

        <div className="border-t border-white/10 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-neutral-400 text-sm">
            Quer operar com um único sistema? Tudo isto está disponível hoje.
          </p>
          <Link
            to="/auth/phone"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20"
          >
            Começar 14 dias grátis
          </Link>
        </div>

        <nav className="mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-4">
          <Link
            to="/landing-v2"
            className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
          >
            ← Voltar à landing
          </Link>
          <Link
            to="/blog/tpv-vs-pos-fiscal"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            TPV vs POS fiscal →
          </Link>
          <Link
            to="/blog/quando-abrir-fechar-caixa"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Quando abrir e fechar caixa →
          </Link>
          <Link
            to="/changelog"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Changelog →
          </Link>
        </nav>
      </article>

      <MadeWithLoveFooter variant="default" />
    </main>
  );
}
