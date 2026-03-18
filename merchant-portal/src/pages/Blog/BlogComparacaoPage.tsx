/**
 * Blog: ChefIApp vs Concorrência — Comparação honesta 2026.
 * Página pública SEO. Tabela comparativa real, sem overselling.
 * Rota: /blog/chefiapp-vs-concorrencia
 * Long-tail: ChefIApp vs concorrência, comparação POS restaurante, melhor TPV 2026, alternativa Square Lightspeed.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";

const META_TITLE =
  "ChefIApp vs Concorrência: Comparação Completa 2026";
const META_DESCRIPTION =
  "Comparação honesta do ChefIApp OS com Last.app, SumUp POS, Square e Lightspeed. Tabela de features, preços, compliance fiscal e limitações — sem marketing, apenas factos.";

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

const CANONICAL_URL = "https://chefiapp.com/blog/chefiapp-vs-concorrencia";

/* ─── comparison data ─── */
interface Row {
  feature: string;
  chefiapp: string;
  last: string;
  sumup: string;
  square: string;
  lightspeed: string;
  /** true = positive / false = negative / undefined = neutral */
  chefiappPositive?: boolean;
}

const ROWS: Row[] = [
  { feature: "Preço base/mês", chefiapp: "Plano único", last: "€50–175", sumup: "€0–49", square: "$0–149", lightspeed: "$69+" },
  { feature: "TPV completo", chefiapp: "✓", last: "✓", sumup: "Básico", square: "✓", lightspeed: "✓", chefiappPositive: true },
  { feature: "KDS em tempo real", chefiapp: "✓", last: "✓", sumup: "Só Pro", square: "✓", lightspeed: "+€30/ecrã", chefiappPositive: true },
  { feature: "AppStaff (equipa)", chefiapp: "✓", last: "✓", sumup: "Básico", square: "✓", lightspeed: "Parcial", chefiappPositive: true },
  { feature: "Compliance fiscal PT", chefiapp: "✓ SAF-T", last: "✗", sumup: "✗", square: "✗", lightspeed: "✗", chefiappPositive: true },
  { feature: "Compliance fiscal ES", chefiapp: "✓ TicketBAI", last: "✓ Verifactu", sumup: "✗", square: "✗", lightspeed: "✗", chefiappPositive: true },
  { feature: "Impressão ESC/POS", chefiapp: "✓ WebUSB", last: "✓", sumup: "✓", square: "✓", lightspeed: "✓", chefiappPositive: true },
  { feature: "Recibo = Ecrã", chefiapp: "✓", last: "✗", sumup: "✗", square: "✗", lightspeed: "✗", chefiappPositive: true },
  { feature: "Integrações delivery", chefiapp: "Em dev", last: "250+", sumup: "Limitado", square: "Bom", lightspeed: "Limitado", chefiappPositive: false },
  { feature: "AI features", chefiapp: "Em dev", last: "Limitado", sumup: "✗", square: "Forte", lightspeed: "Moderado", chefiappPositive: false },
  { feature: "Sem contrato", chefiapp: "✓", last: "✓", sumup: "✓", square: "✓", lightspeed: "1 ano", chefiappPositive: true },
  { feature: "Trial gratuito", chefiapp: "14 dias", last: "✓", sumup: "✓", square: "Permanente", lightspeed: "✓" },
  { feature: "Open source core", chefiapp: "✓", last: "✗", sumup: "✗", square: "✗", lightspeed: "✗", chefiappPositive: true },
  { feature: "PWA (sem app store)", chefiapp: "✓", last: "✗", sumup: "✗", square: "✗", lightspeed: "✗", chefiappPositive: true },
];

function cellColor(value: string): string {
  if (value.startsWith("✓")) return "text-emerald-400";
  if (value === "✗") return "text-red-400";
  if (value === "Em dev") return "text-amber-400 italic";
  return "text-neutral-300";
}

export function BlogComparacaoPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = META_TITLE;
    setMeta("description", META_DESCRIPTION);
    setMeta(
      "keywords",
      "ChefIApp vs concorrência, comparação POS restaurante, melhor TPV 2026, alternativa Square, alternativa Lightspeed, Last.app vs ChefIApp, SumUp POS comparação, sistema restaurante Portugal Espanha",
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
      datePublished: "2026-03-18",
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
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
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

      <article className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <p className="text-amber-500/90 text-sm font-medium uppercase tracking-wider mb-4">
          Blog · Comparação
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          ChefIApp vs Concorrência: Comparação Honesta 2026
        </h1>
        <p className="text-neutral-400 text-lg mb-10">
          Uma análise transparente do ChefIApp OS face aos principais sistemas
          POS do mercado. Sem marketing — apenas factos.
        </p>

        <section className="prose prose-invert max-w-none mb-14">
          {/* ─── 1. Introdução ─── */}
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            O mercado de POS está saturado. Como escolher?
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            O mercado de sistemas POS para restaurantes nunca teve tantas opções.
            Há dezenas de soluções — desde gigantes globais como Square e
            Lightspeed até players europeus como Last.app e SumUp. Para quem abre
            um restaurante ou quer trocar de sistema, a escolha é esmagadora.
          </p>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Fizemos o trabalho por si. Comparámos o ChefIApp com os 4 players
            mais relevantes para restaurantes na Península Ibérica e Europa.
            Incluímos funcionalidades onde somos fortes e áreas onde a
            concorrência está à frente. Porque acreditamos que a honestidade é o
            melhor marketing.
          </p>

          {/* ─── 2. Tabela de Comparação ─── */}
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Tabela de comparação
          </h2>
          <p className="text-neutral-400 text-sm mb-6">
            Dados recolhidos em Março 2026. Preços e funcionalidades podem variar
            — consulte sempre o site oficial de cada fornecedor.
          </p>

          <div className="overflow-x-auto -mx-6 px-6 mb-10">
            <table className="w-full text-sm border-collapse rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-amber-600/20 text-amber-400">
                  <th className="text-left px-4 py-3 font-semibold border-b border-white/10">
                    Feature
                  </th>
                  <th className="text-left px-4 py-3 font-semibold border-b border-white/10 bg-amber-600/10">
                    ChefIApp
                  </th>
                  <th className="text-left px-4 py-3 font-semibold border-b border-white/10">
                    Last.app
                  </th>
                  <th className="text-left px-4 py-3 font-semibold border-b border-white/10">
                    SumUp POS
                  </th>
                  <th className="text-left px-4 py-3 font-semibold border-b border-white/10">
                    Square
                  </th>
                  <th className="text-left px-4 py-3 font-semibold border-b border-white/10">
                    Lightspeed
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={
                      i % 2 === 0 ? "bg-neutral-900/60" : "bg-neutral-900/30"
                    }
                  >
                    <td className="px-4 py-3 font-medium text-neutral-200 border-b border-white/5">
                      {row.feature}
                    </td>
                    <td
                      className={`px-4 py-3 font-medium border-b border-white/5 bg-amber-600/5 ${cellColor(row.chefiapp)}`}
                    >
                      {row.chefiapp}
                    </td>
                    <td
                      className={`px-4 py-3 border-b border-white/5 ${cellColor(row.last)}`}
                    >
                      {row.last}
                    </td>
                    <td
                      className={`px-4 py-3 border-b border-white/5 ${cellColor(row.sumup)}`}
                    >
                      {row.sumup}
                    </td>
                    <td
                      className={`px-4 py-3 border-b border-white/5 ${cellColor(row.square)}`}
                    >
                      {row.square}
                    </td>
                    <td
                      className={`px-4 py-3 border-b border-white/5 ${cellColor(row.lightspeed)}`}
                    >
                      {row.lightspeed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ─── 3. O que nos distingue ─── */}
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            ChefIApp: o que nos distingue
          </h2>

          <h3 className="text-xl font-semibold text-white mt-8 mb-3">
            Uma verdade operacional
          </h3>
          <p className="text-neutral-300 leading-relaxed mb-4">
            O ChefIApp não é mais um POS. É um sistema operativo para o
            restaurante. TPV, KDS, menu, Staff App, reservas, analytics — tudo
            ligado à mesma verdade. Quando um empregado regista um pedido no TPV,
            a cozinha vê-o no KDS no mesmo segundo. Quando a cozinha marca
            "pronto", o empregado é notificado na Staff App. Não há
            sincronizações demoradas, não há dados duplicados, não há sistemas a
            falar entre si com atraso. É um cérebro único.
          </p>

          <h3 className="text-xl font-semibold text-white mt-8 mb-3">
            Recibo fiscal idêntico no ecrã e na impressora
          </h3>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Na maioria dos POS, o que o cliente vê no ecrã de confirmação de
            pagamento é uma coisa; o que sai na impressora é outra. No ChefIApp,
            o recibo que aparece no ecrã do TPV é pixel-a-pixel o mesmo que sai
            na impressora térmica ESC/POS. Isto elimina discrepâncias, simplifica
            auditorias e dá confiança ao operador: "o que vejo é o que imprimo."
          </p>

          <h3 className="text-xl font-semibold text-white mt-8 mb-3">
            Compliance fiscal nativo
          </h3>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Compliance fiscal não é um add-on no ChefIApp — é parte da
            arquitectura. Suportamos SAF-T para Portugal e TicketBAI para
            Espanha (País Basco e Navarra). Cada venda gera automaticamente os
            dados fiscais no formato exigido pela legislação local. Para
            restaurantes que operam na Península Ibérica, isto significa menos
            preocupações com a AT ou a Hacienda.
          </p>

          <h3 className="text-xl font-semibold text-white mt-8 mb-3">
            Sem lock-in, sem contratos
          </h3>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Não exigimos contratos anuais. Não cobramos taxas de saída. O core é
            open source. Se o ChefIApp não servir, pode sair a qualquer momento
            e levar os seus dados consigo. Acreditamos que a melhor forma de
            reter clientes é fazer um produto bom — não é prendê-los com
            cláusulas contratuais.
          </p>

          <h3 className="text-xl font-semibold text-white mt-8 mb-3">
            PWA — funciona em qualquer dispositivo
          </h3>
          <p className="text-neutral-300 leading-relaxed mb-4">
            O ChefIApp é uma Progressive Web App. Funciona no browser de
            qualquer tablet, computador ou telemóvel. Não precisa de instalar
            nada da App Store nem do Google Play. Abre o browser, faz login, e
            está a trabalhar. Isto também significa que actualizações são
            automáticas — não há versões desactualizadas nos dispositivos da
            equipa.
          </p>

          {/* ─── 4. Limitações ─── */}
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Onde somos honestos sobre limitações
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Nenhum sistema é perfeito, e o ChefIApp não é excepção. Aqui está o
            que ainda não fazemos tão bem como a concorrência:
          </p>
          <ul className="list-disc pl-6 text-neutral-300 space-y-3 mb-6">
            <li>
              <strong className="text-white">Integrações de delivery em desenvolvimento.</strong>{" "}
              O Last.app tem mais de 250 integrações com plataformas de delivery.
              Nós ainda estamos a construir as nossas. Se o seu negócio depende
              fortemente de Uber Eats, Glovo ou Just Eat, hoje ainda não temos
              integração directa.
            </li>
            <li>
              <strong className="text-white">AI features planeadas mas não lançadas.</strong>{" "}
              O Square tem funcionalidades de inteligência artificial maduras. Nós
              temos AI no roadmap — previsão de procura, sugestões de menu,
              optimização de turnos — mas ainda não estão em produção. Não vamos
              dizer que temos AI quando não temos.
            </li>
            <li>
              <strong className="text-white">Menos anos de mercado.</strong>{" "}
              O Lightspeed existe desde 2005. O Square desde 2009. Nós somos
              mais novos. Isso significa menos battle-testing em cenários
              extremos e uma base de conhecimento mais pequena.
            </li>
            <li>
              <strong className="text-white">Base de clientes menor.</strong>{" "}
              Uma base de clientes grande significa mais feedback, mais edge
              cases cobertos, mais integrações exigidas pelo mercado. A nossa
              base está a crescer, mas é objectivamente menor que a dos players
              estabelecidos.
            </li>
          </ul>
          <p className="text-neutral-400 text-sm italic mb-8">
            Preferimos que descubra estas limitações aqui do que depois de
            assinar. Transparência é parte do produto.
          </p>

          {/* ─── 5. Para quem é ─── */}
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Para quem é o ChefIApp
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            O ChefIApp não é para todos — e está tudo bem. Fomos desenhados para
            um perfil específico de restaurante:
          </p>
          <ul className="list-disc pl-6 text-neutral-300 space-y-3 mb-6">
            <li>
              <strong className="text-white">Restaurantes que valorizam transparência.</strong>{" "}
              Se prefere um fornecedor que diz "ainda não temos isto" em vez de
              prometer e não cumprir, o ChefIApp é para si.
            </li>
            <li>
              <strong className="text-white">Operações que precisam de compliance fiscal ibérico.</strong>{" "}
              Se opera em Portugal ou Espanha e precisa de SAF-T ou TicketBAI
              nativos — sem plugins, sem terceiros, sem gambiarras — o ChefIApp
              resolve isto de raiz.
            </li>
            <li>
              <strong className="text-white">Equipas que querem um sistema que "simplesmente funciona".</strong>{" "}
              Sem hardware proprietário. Sem instalações complicadas. Abre o
              browser, faz login, a equipa começa a trabalhar. O empregado
              novo aprende em minutos, não em dias.
            </li>
            <li>
              <strong className="text-white">Donos que não querem ficar presos.</strong>{" "}
              Sem contrato anual, sem taxas de saída, core open source. Se
              funcionar, fica. Se não funcionar, sai. Simples.
            </li>
          </ul>

          {/* ─── 6. CTA ─── */}
        </section>

        <div className="border-t border-white/10 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-neutral-200 font-medium mb-1">
              Ainda a decidir? Experimente sem compromisso.
            </p>
            <p className="text-neutral-400 text-sm">
              14 dias grátis. Sem cartão de crédito. Sem contrato.
            </p>
          </div>
          <Link
            to="/auth/phone"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20"
          >
            Experimenta 14 dias grátis
          </Link>
        </div>

        {/* ─── 7. Navigation ─── */}
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
            TPV para restaurantes →
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
