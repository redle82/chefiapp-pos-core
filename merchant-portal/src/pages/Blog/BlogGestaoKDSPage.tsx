/**
 * Blog: Gestao de Cozinha com KDS — Pagina publica SEO.
 * Rota: /blog/gestao-cozinha-kds
 * Long-tail: KDS cozinha, kitchen display system, gestao cozinha restaurante, sistema cozinha
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";

const META_TITLE =
  "Gestao de Cozinha com KDS: Do Caos a Eficiencia — ChefIApp™";
const META_DESCRIPTION =
  "Como um Kitchen Display System transforma a operacao da cozinha: menos erros, tempos mais rapidos, comunicacao clara entre sala e cozinha.";

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

const CANONICAL_URL = "https://chefiapp.com/blog/gestao-cozinha-kds";

export function BlogGestaoKDSPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = META_TITLE;
    setMeta("description", META_DESCRIPTION);
    setMeta(
      "keywords",
      "KDS cozinha, kitchen display system, gestao cozinha restaurante, sistema cozinha, ecra cozinha, pedidos cozinha, KDS restaurante",
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
      {/* Header minimo */}
      <header className="border-b border-white/5 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
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

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <p className="text-amber-500/90 text-xs font-medium uppercase tracking-widest mb-4">
          Operacoes
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Gestao de Cozinha com KDS: Do Caos a Eficiencia
        </h1>
        <p className="text-lg text-neutral-400 mb-12">
          A cozinha e o coracao do restaurante — e, em muitos casos, o maior
          ponto de caos. Pedidos perdidos, prioridades mal geridas, comunicacao
          por gritos entre sala e cozinha. Um Kitchen Display System elimina
          esta friccao e transforma a cozinha numa operacao previsivel e
          mensuravel.
        </p>

        <section className="prose prose-invert prose-amber max-w-none mb-14">
          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            O que e um KDS e porque substituir o papel
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Um KDS — Kitchen Display System — e um ecra digital instalado na
            cozinha que recebe os pedidos directamente do sistema POS, em tempo
            real, sem necessidade de impressao em papel. Quando o empregado de
            mesa regista um pedido no tablet, esse pedido aparece
            instantaneamente no ecra da cozinha, organizado por prioridade,
            tempo e estacao.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            O sistema de tickets em papel, ainda usado em milhares de
            restaurantes, tem problemas evidentes: os tickets perdem-se, ficam
            ilegíveis com o calor e a gordura, nao permitem reorganizar
            prioridades, nao medem tempos de preparacao e criam uma dependencia
            total da memoria e atencao do chefe de cozinha. Quando o servico
            acelera, o papel colapsa.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Um KDS resolve tudo isto. Os pedidos sao digitais, imutaveis,
            rastreiaveis. Nao se perdem, nao ficam ilegíveis, e qualquer
            alteracao feita na sala — um item adicionado, uma nota especial,
            um cancelamento — reflecte-se instantaneamente no ecra da cozinha.
            Nao ha "o empregado esqueceu-se de avisar a cozinha". O sistema
            avisa automaticamente.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Como funciona um KDS moderno
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Num KDS moderno, cada pedido aparece como um cartao no ecra com
            informacao clara: numero da mesa, itens pedidos, notas especiais
            (alergias, preferencias de cozedura), hora do pedido e tempo
            decorrido desde que o pedido entrou. Os cartoes sao organizados
            cronologicamente — first in, first out — mas podem ser priorizados
            manualmente quando necessario.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Cada cartao tem um timer visual que muda de cor conforme o tempo
            avanca. Verde nos primeiros minutos, amarelo quando se aproxima do
            tempo alvo, vermelho quando ultrapassa. Isto permite ao chefe de
            cozinha ter uma visao instantanea do estado de toda a operacao sem
            precisar de verificar cada pedido individualmente.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Quando um prato esta pronto, o cozinheiro toca no item ou no cartao
            e marca-o como concluido. Esse sinal pode desencadear um alerta
            para o empregado de mesa — no seu tablet ou por som — indicando que
            o prato esta pronto para ser levado. Em sistemas avancados, o KDS
            tambem calcula a sincronizacao entre pratos: se uma mesa pediu uma
            entrada e um principal, o KDS pode atrasar o inicio do principal
            ate que a entrada esteja quase pronta, para que tudo chegue a mesa
            no timing correcto.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Estacoes dedicadas: KITCHEN, BAR, EXPO
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Numa cozinha profissional, nem todos precisam de ver tudo. O
            cozinheiro de quentes nao precisa dos cocktails do bar. O barman
            nao precisa das sobremesas. E o expedidor (expo) precisa de ver
            o panorama completo para coordenar a saida de pratos.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Um KDS moderno permite criar estacoes dedicadas. Cada ecra mostra
            apenas os itens relevantes para aquela estacao. A estacao KITCHEN
            recebe os pratos quentes e frios. A estacao BAR recebe bebidas e
            cocktails. A estacao EXPO mostra todos os itens de cada mesa,
            permitindo ao expedidor coordenar a saida e garantir que nenhum
            prato sai sozinho quando deveria sair acompanhado.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Esta separacao reduz o ruido visual em cada ecra, permite que cada
            equipa se concentre no que lhe compete, e elimina a confusao de ter
            30 ou 40 itens no mesmo ecra quando so 10 sao relevantes para
            aquela estacao. O resultado e menos erros, mais foco e tempos de
            preparacao mais curtos.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Impacto real nos tempos de servico
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Os numeros variam por operacao, mas os dados da industria sao
            consistentes: restaurantes que migram de tickets em papel para KDS
            reportam uma reducao media de 20% a 30% no tempo entre pedido e
            entrega na mesa. Os erros de preparacao — prato errado, item
            esquecido, nota de alergia ignorada — caem entre 40% e 60%.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            O impacto vai alem da velocidade. Com um KDS, a comunicacao entre
            sala e cozinha torna-se silenciosa e precisa. Nao ha necessidade
            de o empregado ir fisicamente a cozinha perguntar "esta quase?".
            O estado de cada pedido e visivel no tablet da sala. Isto liberta
            tempo para o empregado estar com os clientes em vez de estar a
            fazer de intermediario entre mesa e cozinha.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Alem disso, o KDS gera dados. Tempo medio de preparacao por prato,
            tempo medio por estacao, picos de carga por hora, pratos que
            consistentemente atrasam o servico. Estes dados permitem decisoes
            informadas: reorganizar a carta, reforcar uma estacao em horarios
            de pico, identificar bottlenecks que so o KDS consegue medir de
            forma objectiva.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Implementar KDS sem interromper a operacao
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            A maior resistencia a adopcao de um KDS vem da equipa de cozinha.
            Cozinheiros com anos de experiencia a trabalhar com tickets em
            papel nao mudam de um dia para o outro — nem devem ser forcados a
            isso. A transicao deve ser gradual e pratica.
          </p>
          <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
            <li>
              <strong>Semana 1:</strong> Instale o ecra e mantenha o papel em
              paralelo. A cozinha continua a trabalhar com tickets, mas ve os
              pedidos tambem no ecra. Sem pressao.
            </li>
            <li>
              <strong>Semana 2:</strong> Reduza o papel. O ecra passa a ser a
              referencia principal, o papel funciona como backup. A equipa
              comeca a confiar no digital.
            </li>
            <li>
              <strong>Semana 3:</strong> Elimine o papel. O KDS e a unica
              fonte de verdade. Se surgir algum problema, recue temporariamente
              ao papel, identifique a causa e ajuste.
            </li>
            <li>
              <strong>Semana 4:</strong> Optimize. Com a equipa ja confortavel,
              ajuste timers, alertas e a organizacao dos ecras por estacao.
            </li>
          </ul>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            O ponto crucial e que o KDS nao deve ser imposto como uma
            revolucao. Deve ser introduzido como uma melhoria incremental que a
            equipa adopta ao seu ritmo. Os cozinheiros mais resistentes
            costumam ser os maiores defensores do sistema depois de duas
            semanas — porque percebem que o KDS os protege de erros que antes
            eram inevitaveis.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Em termos de hardware, um tablet Android de 10 polegadas com capa
            resistente e suporte de parede e suficiente para comecar. Nao
            precisa de equipamento especializado de cozinha — embora ecras
            profissionais com proteccao IP65 sejam recomendaveis em ambientes
            com muito vapor e gordura. O investimento inicial e minimo
            comparado com o retorno em eficiencia.
          </p>
        </section>

        {/* CTA */}
        <div className="border-t border-neutral-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-neutral-400 text-sm">
            Ve o KDS do ChefIApp em accao — sem compromisso.
          </p>
          <Link
            to="/auth/phone"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20"
          >
            Comecar 14 dias gratis
          </Link>
        </div>

        <nav className="mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-4">
          <Link
            to="/"
            className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
          >
            &larr; Voltar a landing
          </Link>
          <Link
            to="/blog/como-escolher-pos"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Como Escolher o Melhor POS &rarr;
          </Link>
          <Link
            to="/blog/compliance-fiscal-pt-es"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Compliance Fiscal PT/ES &rarr;
          </Link>
        </nav>
      </article>

      <MadeWithLoveFooter variant="default" />
    </main>
  );
}
