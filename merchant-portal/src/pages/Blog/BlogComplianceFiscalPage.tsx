/**
 * Blog: Compliance Fiscal para Restaurantes em Portugal e Espanha — Pagina publica SEO.
 * Rota: /blog/compliance-fiscal-pt-es
 * Long-tail: compliance fiscal restaurante, SAF-T Portugal, TicketBAI Espanha, Verifactu, ATCUD, faturacao restaurante
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";

const META_TITLE =
  "Compliance Fiscal para Restaurantes em Portugal e Espanha: Guia 2026 — ChefIApp™";
const META_DESCRIPTION =
  "Guia completo sobre obrigacoes fiscais para restaurantes na Peninsula Iberica. SAF-T, ATCUD, TicketBAI, Verifactu — tudo o que precisa saber.";

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
      "compliance fiscal restaurante, SAF-T Portugal, TicketBAI Espanha, Verifactu, ATCUD, faturacao restaurante, obrigacoes fiscais restauracao",
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
          Legal / Fiscal
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Compliance Fiscal para Restaurantes em Portugal e Espanha: Guia 2026
        </h1>
        <p className="text-lg text-neutral-400 mb-12">
          A legislacao fiscal para restaurantes na Peninsula Iberica mudou mais
          nos ultimos 3 anos do que na decada anterior. SAF-T, ATCUD, TicketBAI,
          Verifactu — siglas que muitos donos de restaurante desconhecem mas que
          podem custar milhares de euros em multas. Este guia explica tudo o que
          precisa de saber para manter o seu restaurante em conformidade em 2026.
        </p>

        <section className="prose prose-invert prose-amber max-w-none mb-14">
          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            A fiscalidade nos restaurantes ibericos esta a mudar
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Durante anos, a fiscalidade na restauracao funcionava num modelo
            relativamente simples: emitir facturas, guardar copias, entregar a
            contabilidade no final do mes. Os sistemas POS limitavam-se a
            imprimir recibos e o resto era problema do contabilista. Esse modelo
            acabou.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Tanto Portugal como Espanha estao a implementar sistemas de
            fiscalizacao digital em tempo real, onde o software de facturacao e
            o primeiro ponto de controlo. O objectivo e claro: eliminar a
            evasao fiscal na restauracao, um sector historicamente associado a
            economia paralela. O meio e igualmente claro: obrigar o software a
            garantir a integridade dos dados fiscais, com assinaturas digitais,
            codigos unicos e reporting automatico as autoridades tributarias.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Para os donos de restaurante que operam correctamente, isto e uma
            boa noticia — desde que o seu software esteja preparado. Para quem
            usa sistemas desactualizados, nao certificados ou importados sem
            adaptacao local, e uma bomba-relogio que pode explodir na proxima
            inspecao.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Portugal: SAF-T e ATCUD
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Em Portugal, o eixo central do compliance fiscal e o ficheiro SAF-T
            (Standard Audit File for Tax). Este ficheiro XML, definido pela
            Autoridade Tributaria (AT), contem todos os documentos comerciais
            emitidos pelo software — facturas, facturas simplificadas, notas de
            credito, guias de transporte, consultas de mesa. O SAF-T deve ser
            exportado mensalmente e submetido a AT. Se o seu POS nao gera SAF-T
            correctamente, nao e legal opera-lo em Portugal. Ponto final.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Desde 2024, todos os documentos fiscais emitidos em Portugal devem
            conter um ATCUD — Codigo Unico de Documento. O ATCUD e composto
            pelo codigo de validacao da serie (obtido junto da AT antes de
            comecar a emitir documentos nessa serie) e pelo numero sequencial do
            documento dentro dessa serie. Este codigo aparece impresso no recibo
            e permite a qualquer pessoa — cliente, inspector ou auditor —
            verificar a autenticidade e rastreabilidade do documento.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Alem do ATCUD, cada documento deve conter uma hash chain
            criptografica. Isto significa que cada factura e assinada
            digitalmente com base no conteudo da factura anterior, criando uma
            cadeia inquebravel de documentos. Se alguem tentar alterar, eliminar
            ou inserir uma factura retroactivamente, a cadeia parte-se e a
            fraude torna-se detectavel pela AT. O algoritmo usado e RSA-SHA1, e
            a chave privada e registada junto da autoridade tributaria no
            momento da certificacao do software.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            A numeracao dos documentos deve ser sequencial e sem falhas. Se a
            factura 1001 existe, a 1002 tem de existir. Um salto de 1001 para
            1003 e uma irregularidade fiscal que pode desencadear uma auditoria
            e multas. O software e responsavel por garantir que isto nunca
            acontece — mesmo em cenarios de falha de rede, crash do sistema,
            dois terminais a emitir em simultaneo ou erro do operador. A
            integridade sequencial nao e negociavel.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Espanha: TicketBAI e Verifactu
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Em Espanha, o panorama fiscal e mais fragmentado devido a estrutura
            autonomica, mas igualmente exigente. O Pais Basco foi o pioneiro com
            o sistema TicketBAI, que obriga todos os negocios a emitir facturas
            atraves de software certificado que gera um ficheiro XML assinado
            digitalmente para cada transaccao. Esse ficheiro e enviado
            automaticamente a administracao fiscal regional. TicketBAI e
            obrigatorio em Bizkaia, Gipuzkoa e Araba desde 2024 e inclui
            mecanismos de verificacao pelo consumidor atraves de codigo QR.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Para o resto de Espanha, o governo central esta a implementar o
            sistema Verifactu, que segue principios semelhantes ao TicketBAI mas
            com ambito nacional. O Verifactu obriga o software de facturacao a
            gerar registos inviolaveis de cada transaccao, com assinatura
            digital e envio automatico (ou disponibilizacao imediata) a Agencia
            Tributaria. A implementacao esta a ser faseada, com obrigatoriedade
            para todos os negocios prevista ate final de 2026.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Tal como em Portugal, o software de facturacao em Espanha deve ser
            certificado pela administracao competente. A certificacao e
            obrigatoria — usar software nao certificado e, por si so, uma
            infraccao fiscal. Mas a certificacao e apenas o ponto de partida:
            o sistema deve garantir a integridade dos dados em tempo real, nao
            apenas no momento da certificacao. Um software certificado em 2024
            que nao recebe actualizacoes pode estar em incumprimento em 2026
            sem que o dono do restaurante sequer saiba.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            O que o seu POS deve garantir
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Independentemente de operar em Portugal, Espanha ou em ambos os
            mercados, o seu sistema POS deve garantir os seguintes requisitos
            fiscais sem excepcao:
          </p>
          <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
            <li>
              <strong className="text-white">
                Numeracao sequencial sem falhas.
              </strong>{" "}
              Cada documento fiscal deve ter um numero sequencial dentro da sua
              serie. Sem saltos, sem duplicados, sem resets. Mesmo com varios
              terminais a operar em simultaneo.
            </li>
            <li>
              <strong className="text-white">
                Assinatura digital RSA-SHA1.
              </strong>{" "}
              Cada documento deve ser assinado digitalmente, criando uma hash
              chain que liga cada factura a anterior. A chave privada deve ser
              protegida e registada junto da autoridade fiscal competente.
            </li>
            <li>
              <strong className="text-white">Codigo QR fiscal.</strong> Cada
              recibo deve incluir um codigo QR que permite ao cliente ou a um
              inspector verificar a autenticidade do documento junto da
              administracao tributaria.
            </li>
            <li>
              <strong className="text-white">
                Exportacao SAF-T automatica.
              </strong>{" "}
              O sistema deve gerar o ficheiro SAF-T com todos os documentos do
              periodo, no formato XML correcto e actualizado, pronto para
              submissao a AT sem intervencao tecnica.
            </li>
            <li>
              <strong className="text-white">ATCUD em cada recibo.</strong>{" "}
              Todos os documentos fiscais devem incluir o Codigo Unico de
              Documento, composto pelo codigo de validacao da serie e pelo
              numero sequencial. Sem ATCUD, o documento e invalido.
            </li>
            <li>
              <strong className="text-white">
                Serie de documentos controlada.
              </strong>{" "}
              Cada serie deve ser comunicada e validada junto da AT antes de
              ser utilizada. O sistema deve gerir as series automaticamente,
              incluindo a transicao de ano fiscal e a criacao de novas series
              quando necessario.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Penalidades por incumprimento
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            As penalidades por incumprimento fiscal nao sao risco teorico. Sao
            reais, frequentes e podem ser devastadoras para um restaurante. Em
            Portugal, a utilizacao de software nao certificado, a emissao de
            documentos sem ATCUD, falhas na hash chain ou irregularidades na
            numeracao sequencial podem resultar em coimas que vao de 375 euros
            a 112.500 euros, dependendo da gravidade, da dimensao da empresa e
            da reincidencia.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Em Espanha, as multas podem atingir os 150.000 euros para
            infraccoes graves relacionadas com software de facturacao. O uso de
            software que permita a manipulacao de registos fiscais — os chamados
            "software de supressao" ou "software de dupla utilizacao" — e
            considerado infraccao muito grave e pode levar ao encerramento
            temporario do estabelecimento e a responsabilidade criminal para o
            gerente.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Alem das multas directas, o incumprimento fiscal pode desencadear
            auditorias retroactivas que analisam anos de operacao. O custo em
            tempo, advogados, contabilistas e stress e muitas vezes superior ao
            da propria multa. E nao se iluda: as inspecoes fiscais a
            restaurantes aumentaram significativamente nos ultimos dois anos,
            tanto em Portugal como em Espanha. Nao e risco teorico — e risco
            concreto e crescente.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Software certificado vs compliance nativo
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Ha uma distincao importante que muitos donos de restaurante
            desconhecem: ter software certificado nao e o mesmo que ter
            compliance fiscal nativo. A certificacao e um selo que confirma que
            o software cumpria os requisitos no momento da certificacao. Mas a
            legislacao muda, as regras apertam, e um software certificado em
            2023 pode nao cumprir os requisitos de 2026 se nao for actualizado
            continuamente.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Compliance nativo significa que as regras fiscais estao integradas
            no nucleo do sistema desde o primeiro dia, nao adicionadas como um
            modulo extra, um plugin ou um patch posterior. A hash chain, o
            ATCUD, a numeracao sequencial, a exportacao SAF-T, os codigos QR
            fiscais — nada disto e opcional ou configuravel. E parte da
            arquitectura base do sistema.
          </p>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            A diferenca pratica e significativa. Um sistema com compliance
            nativo nao permite que o operador cometa erros fiscais, mesmo sem
            querer. Nao e possivel eliminar uma factura — apenas anula-la com
            nota de credito, mantendo o rastro. Nao e possivel alterar um
            documento emitido. Nao e possivel criar saltos na numeracao. O
            sistema protege o negocio automaticamente, sem depender da formacao
            ou da atencao do operador.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
            Checklist de compliance fiscal 2026
          </h2>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Use esta lista para verificar se o seu restaurante esta em
            conformidade com as exigencias fiscais actuais em Portugal e
            Espanha:
          </p>
          <ul className="list-disc list-inside text-neutral-300 mb-4 space-y-2">
            <li>
              O software de facturacao esta certificado pela AT (Portugal) ou
              registado na administracao competente (Espanha)?
            </li>
            <li>
              Todos os recibos incluem ATCUD (Portugal) ou codigo Verifactu/
              TicketBAI (Espanha)?
            </li>
            <li>
              O sistema gera hash chain criptografica automatica em cada
              documento, sem excepcao?
            </li>
            <li>
              A numeracao dos documentos e sequencial e sem falhas, mesmo com
              varios terminais em simultaneo?
            </li>
            <li>
              O ficheiro SAF-T e gerado correctamente e submetido mensalmente
              a AT?
            </li>
            <li>
              Cada recibo inclui codigo QR fiscal verificavel?
            </li>
            <li>
              As series de documentos estao comunicadas e validadas junto da AT
              antes de serem utilizadas?
            </li>
            <li>
              O software recebe actualizacoes regulares para acompanhar
              mudancas legislativas?
            </li>
            <li>
              Existe audit trail completo de todas as operacoes — emissao,
              anulacao, notas de credito, correccoes?
            </li>
            <li>
              O sistema impede a eliminacao ou alteracao retroactiva de
              documentos fiscais emitidos?
            </li>
            <li>
              Em caso de operacao em ambos os paises, o sistema suporta os
              requisitos de Portugal e Espanha em simultaneo?
            </li>
            <li>
              O contabilista tem acesso directo aos dados fiscais e ao SAF-T
              sem depender de exportacoes manuais?
            </li>
            <li>
              O sistema funciona offline mantendo a integridade fiscal e
              sincroniza quando recupera ligacao?
            </li>
            <li>
              O fornecedor do software tem historico comprovado de actualizacoes
              face a alteracoes legislativas?
            </li>
          </ul>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            Se respondeu "nao" ou "nao sei" a qualquer uma destas perguntas,
            tem trabalho a fazer. O custo de resolver o compliance agora e uma
            fraccao do custo de resolver uma multa, uma auditoria ou uma
            migracao de sistema forcada depois. Em 2026, nao ha desculpa para
            operar com software que nao garante conformidade fiscal nativa.
          </p>
        </section>

        {/* CTA */}
        <div className="border-t border-neutral-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-neutral-400 text-sm">
            ChefIApp tem compliance fiscal nativo — teste 14 dias gratis.
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
