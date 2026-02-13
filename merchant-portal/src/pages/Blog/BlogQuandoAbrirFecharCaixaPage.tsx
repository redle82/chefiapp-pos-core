/**
 * Blog: Quando abrir e fechar caixa no restaurante — Turno e TPV.
 * Página pública SEO. Só factos: o que o sistema faz hoje (abrir/fechar caixa, saldo inicial, fecho declarado, Z-Report).
 * Rota: /blog/quando-abrir-fechar-caixa
 * Long-tail: quando abrir caixa restaurante, quando fechar caixa, turno TPV, abertura fecho caixa restaurante.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChefIAppSignature } from "../../ui/design-system/sovereign/ChefIAppSignature";

const META_TITLE =
  "Quando abrir e fechar caixa no restaurante | Turno e TPV";
const META_DESCRIPTION =
  "Abertura e fecho de caixa no restaurante: quando abrir, quando fechar, saldo inicial e fecho declarado. O que o ChefIApp™ OS faz hoje — uma caixa por restaurante, turno aberto antes de vender, Z-Report no fecho. Sem mentiras.";

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

const CANONICAL_URL = "https://chefiapp.com/blog/quando-abrir-fechar-caixa";

export function BlogQuandoAbrirFecharCaixaPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = META_TITLE;
    setMeta("description", META_DESCRIPTION);
    setMeta(
      "keywords",
      "quando abrir caixa restaurante, quando fechar caixa, turno TPV, abertura fecho caixa, Z-Report restaurante"
    );
    setMeta("og:title", META_TITLE, true);
    setMeta("og:description", META_DESCRIPTION, true);
    setMeta("og:type", "article", true);
    setMeta("og:url", CANONICAL_URL, true);

    let linkCanonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
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
    let scriptJsonLd = document.getElementById("blog-article-jsonld") as HTMLScriptElement | null;
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
            <ChefIAppSignature variant="full" size="sm" tone="gold" />
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
          Quando abrir e fechar caixa no restaurante?
        </h1>
        <p className="text-neutral-400 text-lg mb-10">
          Donos e gerentes perguntam: quando abrir caixa, quando fechar, que
          saldo inicial usar. Este texto descreve o que um sistema operacional
          como o ChefIApp™ OS faz hoje — abertura de turno, caixa única, fecho
          declarado e Z-Report — sem prometer o que não existe no produto.
        </p>

        <section className="prose prose-invert max-w-none mb-14">
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Por que abrir e fechar caixa?
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Num restaurante, o turno de caixa corresponde ao período em que as
            vendas são registadas numa mesma “caixa”: saldo inicial à abertura,
            vendas durante o serviço, saldo declarado no fecho. Abrir caixa no
            início do dia (ou do turno) e fechar no fim permite fechar contas
            diárias, comparar o que entrou com o que está no drawer e gerar
            relatórios de fecho (Z-Report). Sem isso, pedidos e pagamentos
            ficam soltos; com isso, há um corte claro entre um dia e o outro.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Quando abrir caixa?
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            No mundo real, abre-se caixa quando começa o período de vendas que
            queres contabilizar em bloco — normalmente no início do dia ou do
            turno. O sistema pede um <strong>saldo inicial</strong> (quanto
            dinheiro já está no caixa, por exemplo da noite anterior). Esse
            valor fica registado; as vendas do dia somam-se a ele. No ChefIApp™
            OS existe uma caixa por restaurante (“Caixa Principal”). Enquanto a
            caixa estiver fechada, o TPV não permite lançar pedidos nem
            pagamentos — a abertura é obrigatória antes de operar.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Quando fechar caixa?
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Fecha-se caixa no fim do dia ou do turno, quando queres “cortar” o
            período e gerar o relatório de fecho. No fecho, o operador declara
            o <strong>saldo em caixa</strong> (quanto dinheiro está
            fisicamente no drawer). O sistema gera o Z-Report (totais de vendas,
            pagamentos, etc.) e regista o evento de fecho. Depois disso, para
            voltar a vender é preciso abrir um novo turno. Não há fecho
            automático por hora — o fecho é manual e intencional.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            O que o ChefIApp™ OS faz hoje (sem mentiras)
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Tudo o que se segue existe no produto e no código. Uma caixa por
            restaurante; abertura com saldo inicial em cêntimos; fecho com
            saldo declarado e RPC atómico que gera o evento de fecho e
            relatório. O TPV e o fluxo operacional bloqueiam até haver caixa
            aberta. O onboarding sugere um valor de abertura (configurável);
            o ritual de “abrir turno” é o mesmo que abrir caixa. Nada de
            “em breve” — é o que está implementado.
          </p>
          <ul className="list-disc pl-6 text-neutral-300 space-y-2 mb-6">
            <li>Abertura de caixa com saldo inicial (valor em euros/cêntimos).</li>
            <li>Uma caixa activa por restaurante (“Caixa Principal”).</li>
            <li>TPV e pedidos só funcionam com caixa aberta.</li>
            <li>Fecho com saldo declarado e geração de Z-Report / evento de fecho.</li>
            <li>Novo turno = nova abertura de caixa.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Resumo
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Abrir caixa = início do período de vendas, com saldo inicial
            registado. Fechar caixa = fim do período, com saldo declarado e
            relatório de fecho. O ChefIApp™ OS faz isso hoje com uma caixa por
            restaurante, abertura e fecho manuais e atómicos. Se precisares de
            múltiplas caixas ou regras automáticas por hora, isso não está no
            produto — e não afirmamos que está.
          </p>
        </section>

        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-neutral-300 mb-6">
            Quer um sistema operacional que liga sala, cozinha e caixa numa
            única verdade?
          </p>
          <Link
            to="/auth/phone"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-colors duration-200 hover:shadow-lg hover:shadow-amber-500/20"
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
            to="/blog/tpv-vs-pos-fiscal"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            TPV vs POS fiscal →
          </Link>
          <Link
            to="/changelog"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Changelog →
          </Link>
        </nav>
      </article>
    </main>
  );
}
