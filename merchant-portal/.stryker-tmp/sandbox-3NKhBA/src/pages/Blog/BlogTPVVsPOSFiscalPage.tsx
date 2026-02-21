/**
 * Blog: TPV vs POS fiscal — Diferença honesta.
 * Página pública SEO. Só factos: TPV operacional trabalha em paralelo ao POS fiscal.
 * Rota: /blog/tpv-vs-pos-fiscal
 * Long-tail (título + 1.º parágrafo): TPV vs POS fiscal, diferença TPV POS, ponto de venda operacional, POS fiscal, restaurante.
 */
// @ts-nocheck

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";

const META_TITLE =
  "TPV vs POS fiscal | Diferença entre ponto de venda operacional e fiscal";
const META_DESCRIPTION =
  "TPV operacional e POS fiscal não são a mesma coisa. Um gere a operação (mesas, pedidos, caixa); o outro emite documentos fiscais. Como o ChefIApp™ OS trabalha em paralelo ao seu POS fiscal — sem mentiras.";

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

const CANONICAL_URL = "https://chefiapp.com/blog/tpv-vs-pos-fiscal";

export function BlogTPVVsPOSFiscalPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = META_TITLE;
    setMeta("description", META_DESCRIPTION);
    setMeta(
      "keywords",
      "TPV vs POS fiscal, diferença TPV POS, ponto de venda operacional, POS fiscal restaurante, software TPV fiscal",
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
          TPV vs POS fiscal: qual a diferença?
        </h1>
        <p className="text-neutral-400 text-lg mb-10">
          Muitos donos de restaurantes procuram “TPV” ou “POS” e assumem que é
          tudo a mesma coisa. Não é. Este texto explica a diferença entre
          <strong> ponto de venda operacional</strong> e
          <strong> POS fiscal</strong>, e como o ChefIApp™ OS se posiciona — com
          transparência total.
        </p>

        <section className="prose prose-invert max-w-none mb-14">
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            O que é um POS fiscal?
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            O <strong>POS fiscal</strong> (ou impressora/terminal fiscal) é o
            equipamento ou software certificado pelas autoridades para
            <strong> emitir documentos fiscais</strong>: facturas, recibos
            fiscais, comunicar vendas ao fisco. Em muitos países é obrigatório
            ter um sistema certificado para cada ponto de venda. O POS fiscal
            responde à pergunta: “Como declaro esta venda ao Estado?”
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            O que é um TPV operacional?
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            O <strong>TPV operacional</strong> (ponto de venda operacional) é o
            sistema onde se <strong>gere a operação de vendas</strong>: mesas,
            pedidos, cozinha (KDS), pagamentos, caixa, turnos. Responde à
            pergunta: “O que foi pedido, por quem, em que mesa, e está pago?”
            Pode ou não estar ligado a um POS fiscal — mas a sua função central
            é operacional, não fiscal.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Por que não são a mesma coisa?
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            O POS fiscal está sujeito a certificações e regras por país (IVA,
            códigos de imposto, formato de impressão). O TPV operacional pode
            evoluir rápido (novos fluxos, integrações, UX) sem passar por
            re-certificação fiscal a cada mudança. Em muitos restaurantes
            existem <strong>os dois</strong>: um sistema para operar (mesa →
            pedido → pagar) e outro para cumprir a lei (emitir o documento
            fiscal).
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            O que faz o ChefIApp™ OS?
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            O ChefIApp™ OS é um{" "}
            <strong>sistema operacional para o restaurante</strong>: TPV
            operacional, KDS, menu, Staff App, reservas, página pública — uma
            única verdade operacional. Hoje
            <strong> não substitui o POS fiscal</strong>. Trabalha
            <strong> em paralelo</strong>: o restaurante continua a usar o seu
            POS fiscal para emitir a factura ou o recibo; o ChefIApp gere mesas,
            pedidos, caixa e cozinha. Quando o total está pago, a emissão fiscal
            pode ser feita no POS fiscal (conforme configuração do restaurante).
          </p>
          <p className="text-neutral-400 text-sm italic mb-8">
            Certificação fiscal própria está prevista para mais tarde; até lá,
            os dois sistemas coexistem. Não prometemos “tudo num só” no fiscal
            até que esteja certificado.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Resumo</h2>
          <ul className="list-disc pl-6 text-neutral-300 space-y-2 mb-6">
            <li>
              <strong>POS fiscal</strong> = emitir documentos fiscais
              (certificado, obrigatório por lei).
            </li>
            <li>
              <strong>TPV operacional</strong> = gerir mesas, pedidos,
              pagamentos, caixa, cozinha.
            </li>
            <li>
              <strong>ChefIApp™ OS</strong> = TPV operacional + resto do
              sistema; trabalha em paralelo ao POS fiscal até haver certificação
              própria.
            </li>
          </ul>
        </section>

        <div className="border-t border-white/10 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-neutral-400 text-sm">
            Quer um TPV operacional ligado a uma única verdade? Experimente.
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
            to="/blog/tpv-restaurantes"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            TPV para restaurantes: o que oferecemos hoje →
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
