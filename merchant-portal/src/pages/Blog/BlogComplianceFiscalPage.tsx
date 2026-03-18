/**
 * Blog: Compliance Fiscal para Restaurantes em Portugal e Espanha — Pagina publica SEO.
 * Rota: /blog/compliance-fiscal-pt-es
 * Long-tail: compliance fiscal restaurante, SAF-T Portugal, TicketBAI Espanha, Verifactu, ATCUD
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";

const META_TITLE =
  "Compliance Fiscal para Restaurantes em Portugal e Espanha: Guia Completo 2026 — ChefIApp™";
const META_DESCRIPTION =
  "Guia completo de compliance fiscal para restaurantes na Peninsula Iberica. SAF-T, ATCUD, TicketBAI, Verifactu — o que o seu sistema POS precisa garantir em 2026.";

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

const CANONICAL_URL = "https://chefiapp.com/blog/compliance-fiscal-pt-es";

export function BlogComplianceFiscalPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = META_TITLE;
    setMeta("description", META_DESCRIPTION);
    setMeta(
      "keywords",
      "compliance fiscal restaurante, SAF-T Portugal, TicketBAI Espanha, Verifactu, faturacao restaurante, ATCUD, hash chain fiscal, certificacao software fiscal",
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
          Legal / Fiscal
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Compliance Fiscal para Restaurantes em Portugal e Espanha: Guia
          Completo 2026
        </h1>
        <p className="text-lg text-neutral-400 mb-12">
          A fiscalidade em restaurantes na Peninsula Iberica esta cada vez mais
          exigente. Entre SAF-T em Portugal, TicketBAI no Pais Basco e
          Verifactu no resto de Espanha, manter o compliance fiscal e um
          desafio operacional que o seu sistema POS tem de resolver de forma
          nativa — nao como um add-on que se configura depois.
        </p>

        <section className="prose prose-invert prose-amber max-w-none mb-14">
          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Portugal: SAF-T e ATCUD
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Em Portugal, a Autoridade Tributaria (AT) exige que todos os
            softwares de faturacao sejam certificados e cumpram um conjunto
            rigoroso de requisitos tecnicos. O pilar central e o ficheiro SAF-T
            (Standard Audit File for Tax Purposes) — um formato XML padronizado
            que contem toda a informacao fiscal da empresa: faturas, notas de
            credito, recibos, documentos de transporte e registos contabilisticos.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            O SAF-T nao e opcional. Todos os meses, as empresas sao obrigadas a
            submeter o ficheiro SAF-T de faturacao a AT. Em caso de inspecao, a
            AT pode solicitar o SAF-T completo (contabilidade incluida) de
            qualquer periodo. O software de faturacao deve ser capaz de gerar
            este ficheiro de forma correcta, completa e sem intervencao manual.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Alem do SAF-T, existe a obrigacao do ATCUD — o Codigo Unico de
            Documento. Desde 2023, todos os documentos fiscais emitidos em
            Portugal devem conter um ATCUD, que e composto pelo codigo de
            validacao da serie (atribuido pela AT) e pelo numero sequencial do
            documento. O ATCUD funciona como uma impressao digital unica de
            cada documento, permitindo a rastreabilidade total.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            O sistema deve garantir tambem a hash chain — uma cadeia de
            assinaturas digitais onde cada documento referencia o hash do
            documento anterior. Isto torna impossivel alterar ou eliminar um
            documento sem quebrar a cadeia, dando a AT a garantia de que a
            sequencia de faturacao nao foi manipulada. Qualquer falha na hash
            chain — um documento eliminado, uma numeracao com buracos — e
            detectavel e resulta em penalizacao.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            A numeracao sequencial e obrigatoria e sem falhas. Cada serie de
            documentos deve ter numeracao continua (1, 2, 3...) sem saltos. Se
            o documento numero 47 existe e o proximo e o 49, a AT vai querer
            saber o que aconteceu ao 48. O software deve impedir que isto
            aconteca, mesmo em cenarios de falha de rede, erros de sistema ou
            operacoes simultaneas.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Espanha: TicketBAI e Verifactu
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Em Espanha, o panorama fiscal e mais fragmentado devido a estrutura
            autonomica. O Pais Basco — Alava, Bizkaia e Gipuzkoa — foi
            pioneiro com o sistema TicketBAI, que entrou em vigor de forma
            gradual entre 2022 e 2024. O TicketBAI exige que todos os
            softwares de faturacao registem cada fatura num formato XML
            especifico e a enviem electronicamente a administracao fiscal
            correspondente.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            O TicketBAI inclui requisitos semelhantes ao sistema portugues: hash
            chain entre documentos, assinatura digital com certificado
            qualificado, numeracao sequencial e codigo QR em cada documento que
            permite a verificacao por parte do consumidor. O consumidor pode
            usar o codigo QR para verificar se a fatura foi efectivamente
            comunicada as financas — um mecanismo de controlo cruzado.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Para o resto de Espanha, o governo central introduziu o sistema
            Verifactu, previsto para implementacao obrigatoria em 2026. O
            Verifactu segue principios semelhantes ao TicketBAI: registo
            electronico de todas as faturas, hash chain, assinatura digital e
            comunicacao em tempo real (ou quase real) com a Agencia Tributaria.
            A diferenca principal e que o Verifactu aplica-se a nivel nacional
            e substitui os sistemas autonomicos nas regioes que nao tinham
            sistema proprio.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            A certificacao do software tambem e obrigatoria. Tanto no TicketBAI
            como no Verifactu, o software de faturacao deve estar registado e
            certificado pela administracao fiscal competente. Software nao
            certificado nao pode ser utilizado — e a utilizacao de software
            nao certificado e, por si so, uma infraccao fiscal.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            O que o seu sistema POS precisa garantir
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Independentemente de operar em Portugal, Espanha ou em ambos os
            mercados, o seu sistema POS deve garantir um conjunto minimo de
            capacidades fiscais. Nao se trata de funcionalidades avancadas —
            sao requisitos legais basicos sem os quais o software nao deveria
            estar em operacao.
          </p>
          <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
            <li>
              <strong>Numeracao sequencial sem falhas</strong> — cada serie de
              documentos com numeracao continua, sem saltos, mesmo em cenarios
              de concorrencia ou falha de rede.
            </li>
            <li>
              <strong>Hash chain (assinatura digital encadeada)</strong> — cada
              documento referencia o hash do anterior, criando uma cadeia
              imutavel e verificavel.
            </li>
            <li>
              <strong>Geracao de SAF-T</strong> — exportacao do ficheiro XML no
              formato exigido pela AT portuguesa, pronto para submissao mensal.
            </li>
            <li>
              <strong>ATCUD em todos os documentos</strong> — codigo unico
              composto por validacao da serie e numero sequencial.
            </li>
            <li>
              <strong>Codigos QR fiscais</strong> — nos documentos emitidos,
              para verificacao pelo consumidor e pela administracao fiscal.
            </li>
            <li>
              <strong>Comunicacao electronica</strong> — envio de documentos a
              AT (Portugal) ou a administracao autonomica/nacional (Espanha)
              nos formatos e prazos exigidos.
            </li>
            <li>
              <strong>Certificacao do software</strong> — registo junto da AT
              (Portugal) ou da administracao competente (Espanha).
            </li>
            <li>
              <strong>Audit trail completo</strong> — registo de quem emitiu
              cada documento, quando, e em que contexto (anulacoes, notas de
              credito, correccoes).
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Penalidades por incumprimento
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            As consequencias de nao cumprir com os requisitos fiscais sao
            reais e significativas. Em Portugal, a utilizacao de software nao
            certificado pode resultar em multas que variam entre 375 euros e
            18.750 euros por infraccao, dependendo da dimensao da empresa e da
            gravidade. A falta de submissao do SAF-T mensal, erros no ATCUD ou
            falhas na hash chain sao infraccoes autonomas, cada uma com o seu
            proprio quadro sancionatorio.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Em Espanha, o Regime Geral de Infraccoes e Sancoes Tributarias
            preve multas que podem chegar a 150.000 euros para as infraccoes
            mais graves relacionadas com software de faturacao. A utilizacao
            de software que permita a manipulacao de dados fiscais — conhecida
            como "software de dupla utilizacao" — e considerada infraccao muito
            grave e pode acarretar sancoes adicionais, incluindo a proibicao
            de exercer actividade.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Para alem das multas, ha o risco operacional. Uma inspecao fiscal
            que detecte irregularidades pode resultar no encerramento
            temporario do estabelecimento, na obrigacao de refazer toda a
            contabilidade do periodo em causa, e em danos reputacionais que
            afectam o negocio a longo prazo. O custo de nao ter compliance
            fiscal e sempre superior ao custo de o ter.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Como o ChefIApp resolve isto
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            O ChefIApp foi desenhado com compliance fiscal como parte do nucleo
            do sistema, nao como um modulo extra ou um add-on que se activa
            depois. A arquitectura do sistema garante que cada documento emitido
            cumpre automaticamente os requisitos legais sem que o operador
            precise de pensar nisso.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            A hash chain e gerada automaticamente a cada documento. A numeracao
            sequencial e garantida a nivel de base de dados, com mecanismos de
            proteccao contra concorrencia que impedem saltos mesmo em cenarios
            de multiplos terminais a operar em simultaneo. O ATCUD e calculado
            e inserido em cada documento sem intervencao manual.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            A exportacao SAF-T esta integrada no sistema — o dono do
            restaurante pode gerar o ficheiro para qualquer periodo com um
            clique, pronto para submissao a AT. Os codigos QR fiscais sao
            gerados automaticamente em cada recibo e fatura, cumprindo os
            requisitos de verificacao pelo consumidor.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Para Espanha, o sistema suporta os requisitos do TicketBAI e esta
            preparado para o Verifactu, com a mesma logica: compliance nativo,
            nao retrofit. O objectivo e que o dono do restaurante se preocupe
            com a comida e os clientes, nao com a fiscalidade — o sistema trata
            disso automaticamente.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Checklist de compliance fiscal
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Use esta lista para verificar se o seu sistema actual — ou o
            sistema que esta a avaliar — cumpre os requisitos minimos:
          </p>
          <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
            <li>
              O software esta certificado pela AT (Portugal) ou registado na
              administracao competente (Espanha)?
            </li>
            <li>
              Gera hash chain automatica entre todos os documentos fiscais?
            </li>
            <li>
              A numeracao sequencial e garantida sem saltos, mesmo com varios
              terminais?
            </li>
            <li>
              Gera ATCUD automaticamente em cada documento (Portugal)?
            </li>
            <li>
              Exporta SAF-T no formato correcto e actualizado da AT?
            </li>
            <li>
              Insere codigos QR fiscais em recibos e faturas?
            </li>
            <li>
              Suporta comunicacao electronica com a AT / administracao fiscal?
            </li>
            <li>
              Tem audit trail completo (quem, quando, que documento, que accao)?
            </li>
            <li>
              Impede a eliminacao ou alteracao de documentos fiscais emitidos?
            </li>
            <li>
              Suporta notas de credito e anulacoes dentro do quadro legal?
            </li>
            <li>
              Funciona em caso de falha de internet, mantendo a integridade
              fiscal?
            </li>
            <li>
              O fornecedor tem historico de actualizacoes face a alteracoes
              legislativas?
            </li>
            <li>
              No caso de operar em Espanha: suporta TicketBAI e/ou Verifactu?
            </li>
            <li>
              Os dados fiscais sao armazenados de forma segura e conforme com
              RGPD?
            </li>
          </ul>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Se o seu sistema nao cumpre a maioria destes pontos, esta exposto a
            riscos legais e operacionais. A boa noticia e que em 2026 existem
            solucoes que tratam de tudo isto de forma nativa, sem complicar a
            operacao do dia-a-dia.
          </p>
        </section>

        {/* CTA */}
        <div className="border-t border-neutral-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-neutral-400 text-sm">
            Sistema com compliance fiscal nativo — teste 14 dias, sem cartao.
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
            to="/blog/gestao-cozinha-kds"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Gestao de Cozinha com KDS &rarr;
          </Link>
        </nav>
      </article>

      <MadeWithLoveFooter variant="default" />
    </main>
  );
}
