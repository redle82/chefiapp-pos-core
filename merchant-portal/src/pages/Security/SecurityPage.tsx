/**
 * Segurança e dados — Página pública. Só afirmações verificáveis.
 * Contrato: [TECNICAS_AVANCADAS_SILICON_VALLEY.md] — confiança técnica sem promessas falsas.
 * Rota: /security
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";

const META_TITLE = "Segurança e dados | ChefIApp™ OS";
const META_DESCRIPTION =
  "Como tratamos dados no ChefIApp™ OS: acesso por sessão, sem venda de dados, infraestrutura sob nosso controlo. Sem promessas que não possamos cumprir.";

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

export function SecurityPage() {
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
          Segurança e dados
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          Como tratamos os seus dados
        </h1>
        <p className="text-neutral-400 text-lg mb-12">
          Afirmações verificáveis. Sem certificações que não temos. O que
          fazemos hoje.
        </p>

        <section className="space-y-10 mb-14">
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">
              Acesso por sessão
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              O acesso ao ChefIApp™ OS é autenticado. Utilizadores entram com
              sessão válida; os dados do restaurante (pedidos, menu, equipa,
              configuração) são acedidos apenas no contexto dessa sessão e do
              tenant ao qual o utilizador pertence. Não há acesso anónimo aos
              dados operacionais.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">
              Não vendemos os seus dados
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              Os dados dos restaurantes e dos seus clientes (pedidos, mesas,
              menu, pessoas) não são vendidos a terceiros. São usados para
              operar o sistema e prestar o serviço. Não monetizamos dados com
              publicidade nem revenda.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">
              Infraestrutura e armazenamento
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              Os dados são tratados em infraestrutura sob controlo do ChefIApp
              (ou dos nossos fornecedores de hosting, com contratos que garantem
              confidencialidade e uso exclusivo para o serviço). O núcleo de
              dados (pedidos, runtime, configuração) vive num Core unificado;
              não espalhamos dados por sistemas desconectados.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">
              Privacidade e conformidade
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              O tratamento de dados pessoais e operacionais está descrito na
              nossa{" "}
              <Link
                to="/legal/privacy"
                className="text-amber-500 hover:text-amber-400 underline"
              >
                Política de Privacidade
              </Link>
              . Onde aplicável (ex.: LGPD, GDPR), o restaurante é responsável
              por informar titulares e obter consentimento conforme a lei; nós
              processamos os dados conforme as instruções do cliente e as nossas
              obrigações contratuais.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">
              O que não afirmamos
            </h2>
            <p className="text-neutral-400 leading-relaxed">
              Não afirmamos certificações (ex.: ISO 27001, SOC 2) até as termos.
              Quando as tivermos, serão listadas aqui. Esta página reflecte o
              estado actual — sem exageros.
            </p>
          </div>
        </section>

        <nav className="pt-8 border-t border-white/5 flex flex-wrap gap-4">
          <Link
            to="/legal/privacy"
            className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
          >
            Política de Privacidade
          </Link>
          <Link
            to="/legal/terms"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Termos de utilização
          </Link>
          <Link
            to="/legal/dpa"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            DPA
          </Link>
          <Link
            to="/landing-v2"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            ← Voltar à landing
          </Link>
        </nav>
      </article>

      <MadeWithLoveFooter variant="default" />
    </main>
  );
}
