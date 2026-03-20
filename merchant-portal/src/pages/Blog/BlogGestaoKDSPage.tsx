/**
 * Blog: Gestao de Cozinha com KDS — Pagina publica SEO.
 * Rota: /blog/gestao-cozinha-kds
 * Long-tail: KDS cozinha, kitchen display system, gestao cozinha restaurante, sistema cozinha digital
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";

const META_TITLE =
  "Gestao de Cozinha com KDS: Do Caos a Eficiencia — ChefIApp™";
const META_DESCRIPTION =
  "Como um Kitchen Display System transforma a operacao da cozinha do seu restaurante. Menos erros, mais velocidade, melhor comunicacao.";

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
      "KDS cozinha, kitchen display system, gestao cozinha restaurante, sistema cozinha digital, ecra cozinha restaurante",
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
            to="/auth/email"
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
          A cozinha e o coracao de qualquer restaurante — e tambem o ponto onde
          mais coisas podem correr mal. Tickets que se perdem, letra ilegivel,
          prioridades confusas, gritos entre sala e cozinha. Um Kitchen Display
          System elimina estes problemas de raiz e transforma a cozinha numa
          operacao previsivel e mensuravel.
        </p>

        <section className="prose prose-invert prose-amber max-w-none mb-14">
          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            O problema: a cozinha a funcionar no papel
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Na maioria dos restaurantes, o fluxo de pedidos para a cozinha ainda
            depende de uma impressora termica que cospe tickets em papel. O
            cozinheiro arranca o ticket, cola-o numa barra metalica ou prende-o
            com um iman, e trabalha por ordem de chegada — em teoria. Na
            pratica, o cenario e outro.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Os tickets caem ao chao e ficam debaixo de uma bancada durante o
            servico inteiro. A letra fica ilegivel quando a impressora esta com
            pouco papel ou quando o empregado escreveu a nota a mao a correr.
            As prioridades confundem-se porque nao ha forma visual de saber
            qual pedido esta ha mais tempo a espera. Modificacoes e alergias
            ficam perdidas no meio de abreviaturas que so metade da equipa
            entende.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            O resultado e previsivel: pratos que saem atrasados, pedidos que vao
            para a mesa errada, items esquecidos que so sao descobertos quando o
            cliente reclama, e uma tensao constante entre sala e cozinha que
            prejudica o ambiente de trabalho e, inevitavelmente, a experiencia
            do cliente. Num servico de sabado a noite, uma cozinha que funciona
            no papel esta permanentemente a beira do colapso.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            O que e um KDS
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Um KDS — Kitchen Display System — e um ecra digital instalado na
            cozinha que substitui a impressora de tickets. Em vez de papel, os
            pedidos aparecem num ecra em tempo real, organizados por mesa, por
            hora de entrada e por prioridade. O cozinheiro ve exactamente o que
            precisa de preparar, em que ordem, e ha quanto tempo cada pedido
            esta a espera.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Quando o empregado regista um pedido no POS — no tablet da sala, no
            telemovel ou no terminal fixo — esse pedido aparece
            instantaneamente no ecra da cozinha. Sem impressao, sem papel, sem
            atrasos. Se o cliente pede uma alteracao — sem cebola, trocar o
            acompanhamento, alergia a marisco — a modificacao aparece
            imediatamente no ecra, destacada a cores para que ninguem a ignore.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Quando o cozinheiro termina um prato, toca no ecra e o item muda de
            estado. A sala recebe a notificacao de que o prato esta pronto para
            servir. Sem gritos, sem viagens desnecessarias a cozinha para
            perguntar "ja esta?". Nao e tecnologia futurista — e uma solucao
            que redes de fast-food usam ha mais de 15 anos. A diferenca e que
            hoje esta acessivel a qualquer restaurante com um tablet de 200
            euros montado na parede.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Vantagens concretas
          </h2>
          <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
            <li>
              <strong className="text-white">Zero tickets perdidos.</strong>{" "}
              Cada pedido existe no ecra ate ser marcado como concluido. Nao ha
              papel que caia, que se manche com gordura ou que fique esquecido
              atras da fritadeira.
            </li>
            <li>
              <strong className="text-white">Priorizacao automatica.</strong>{" "}
              O KDS ordena os pedidos por tempo de espera. Os mais antigos ficam
              no topo, com indicadores visuais — verde, amarelo, vermelho — que
              mostram se o tempo esta dentro do aceitavel ou se ja ultrapassou o
              limite definido.
            </li>
            <li>
              <strong className="text-white">Timers visuais.</strong> Cada
              pedido tem um cronometro em tempo real. O chefe de cozinha ve, de
              relance, o estado de toda a operacao sem precisar de verificar
              cada ticket individualmente. Se um pedido esta em vermelho, e
              prioridade imediata.
            </li>
            <li>
              <strong className="text-white">
                Comunicacao directa sala-cozinha.
              </strong>{" "}
              Quando a cozinha marca um prato como pronto, a sala recebe uma
              notificacao instantanea no tablet do empregado. Acabam-se os
              gritos de "mesa 7 pronta!" e as idas desnecessarias a cozinha
              para perguntar pelo estado dos pedidos.
            </li>
            <li>
              <strong className="text-white">Historico digital.</strong> Todos
              os pedidos ficam registados com timestamps precisos. Quanto tempo
              demorou cada prato, quem o preparou, a que horas foi servido.
              Dados objectivos para optimizar processos, resolver disputas e
              identificar bottlenecks.
            </li>
            <li>
              <strong className="text-white">
                Alergias e modificacoes visiveis.
              </strong>{" "}
              Restricoes alimentares aparecem destacadas no ecra, com cores e
              icones que nao passam despercebidos. Um ticket em papel com "s/
              gluten" escrito a caneta e um risco; um alerta vermelho num ecra
              digital e impossivel de ignorar.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Estacoes dedicadas
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Uma das funcionalidades mais poderosas de um KDS bem configurado e a
            separacao por estacoes. Mostrar todos os pedidos a toda a gente cria
            ruido e confusao. O cozinheiro de quentes nao precisa de ver os
            cocktails do bar. O barman nao precisa das sobremesas. E o
            expedidor precisa de ver o panorama completo para coordenar a saida.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            O ecra da <strong className="text-white">COZINHA</strong> mostra os
            items quentes — pratos principais, sopas, entradas que vao ao forno
            ou a grelha. O ecra do <strong className="text-white">BAR
            </strong> mostra apenas bebidas — cocktails, cafes, sumos naturais,
            cervejas artesanais que precisam de preparacao. O ecra do{" "}
            <strong className="text-white">EXPO</strong> (expedicao) mostra o
            pedido completo de cada mesa e serve como ponto de controlo final
            — conferindo que todos os items estao prontos e correctos antes de
            sairem para a sala.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Esta separacao elimina um dos problemas mais frequentes em cozinhas
            ocupadas: o cozinheiro que ignora items de bar porque nao sao "da
            sua responsabilidade", ou o barman que nao viu a bebida porque o
            ticket estava enterrado entre pratos. Cada estacao ve apenas o seu
            trabalho. Quando todos os items de um pedido estao prontos nas
            varias estacoes, o expo e notificado automaticamente de que pode
            montar e enviar para a sala.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Impacto nos tempos de servico
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Os numeros falam por si. Restaurantes que migram de tickets em papel
            para KDS reportam consistentemente melhorias significativas nos
            indicadores operacionais mais importantes. Em media, o tempo de
            preparacao por pedido reduz-se entre 30% e 40%. A razao e simples:
            eliminam-se os tempos mortos de procurar tickets, decifrar letra
            ilegivel, perguntar prioridades e repetir informacao verbalmente.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            A taxa de erros de pedido cai cerca de 80%. Quando o pedido aparece
            num ecra digital, legivel, com modificacoes destacadas e alergias
            sinalizadas a vermelho, a margem para erro humano reduz-se
            drasticamente. Acabam-se os pratos devolvidos por "pedi sem queijo
            e veio com queijo" ou "falta a sobremesa da mesa 12".
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            O impacto indirecto e igualmente relevante. Menos erros significa
            menos desperdicio de comida e menos custos com ingredientes. Menos
            tempo de preparacao significa mais mesas servidas por turno e mais
            receita. Melhor comunicacao entre sala e cozinha significa menos
            stress e melhor ambiente de trabalho — o que se traduz em menor
            rotatividade da equipa, um dos maiores custos ocultos na
            restauracao.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Como implementar sem parar a operacao
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            A transicao para KDS nao precisa de ser dramatica nem de fechar o
            restaurante. O processo recomendado e gradual e respeita o ritmo da
            equipa.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            <strong className="text-white">Passo 1: instalar o ecra.</strong>{" "}
            Monte um tablet ou ecra na cozinha — pode ser um tablet Android de
            10 polegadas, um iPad, ou um ecra dedicado com proteccao contra
            calor e gordura. Ligue-o ao sistema POS e configure as estacoes. O
            processo demora menos de uma hora.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            <strong className="text-white">
              Passo 2: correr paralelo com papel durante 1 semana.
            </strong>{" "}
            A cozinha continua a receber os tickets em papel como sempre, mas
            agora tambem ve os pedidos no ecra. Nao ha pressao para mudar nada
            — a equipa vai-se habituando ao novo sistema naturalmente, sem
            risco. Se o ecra falhar, o papel esta la como backup.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            <strong className="text-white">
              Passo 3: desligar a impressora de tickets.
            </strong>{" "}
            Quando a equipa ja usa o ecra como referencia principal — e isto
            acontece naturalmente em poucos dias, porque o ecra e simplesmente
            mais facil de usar — desligue a impressora de tickets da cozinha.
            Mantenha-a fisicamente no local durante mais uns dias como rede de
            seguranca psicologica. Passada uma semana sem papel, pode
            remove-la com confianca.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            A maioria das equipas adapta-se em menos de 3 dias. O feedback mais
            comum dos cozinheiros e "porque e que nao tinhamos isto antes?". Os
            mais resistentes a mudanca costumam ser os maiores defensores do
            sistema passados 15 dias — porque percebem que o KDS os protege de
            erros que antes eram inevitaveis e lhes da uma visao clara do
            estado da operacao que nunca tiveram com papel.
          </p>
        </section>

        {/* CTA */}
        <div className="border-t border-neutral-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-neutral-400 text-sm">
            Veja o KDS do ChefIApp em accao — teste 14 dias gratis, sem cartao.
          </p>
          <Link
            to="/auth/email"
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
