/**
 * Estado do sistema — Página pública de transparência.
 * Contrato: [TECNICAS_AVANCADAS_SILICON_VALLEY.md] — só afirmar o que podemos demonstrar.
 * Rota: /status
 *
 * Hoje: página estática. Quando existir um health endpoint público e estável,
 * esta página pode passar a mostrar estado em tempo real.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";

const META_TITLE = "Estado do sistema | ChefIApp™ OS";
const META_DESCRIPTION =
  "Transparência operacional do ChefIApp™ OS. Estado dos sistemas e comunicação em caso de incidentes.";

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

export function StatusPage() {
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
          Estado do sistema
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          Transparência operacional
        </h1>
        <p className="text-neutral-400 text-lg mb-12">
          Esta página existe para transparência. Não publicamos percentagens de
          uptime até termos medição contínua e pública. Em caso de incidente,
          comunicamos por WhatsApp aos clientes afectados.
        </p>

        <section className="space-y-6 mb-14">
          <div className="flex items-center justify-between py-4 px-5 rounded-lg bg-neutral-900/50 border border-white/5">
            <div>
              <h2 className="text-lg font-semibold text-white">
                ChefIApp™ OS (Core + aplicação)
              </h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                API, base de dados e front-end
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"
                aria-hidden
              />
              <span className="text-sm font-medium text-neutral-300">
                Operacional
              </span>
            </div>
          </div>

          <p className="text-neutral-500 text-sm">
            Última actualização: esta página é estática. O estado “Operacional”
            reflecte que não há incidentes conhecidos no momento da publicação.
            Quando tivermos um endpoint de health público e monitorização
            contínua, passaremos a mostrar estado e histórico aqui.
          </p>
        </section>

        <nav className="pt-8 border-t border-white/5 flex flex-wrap gap-4">
          <Link
            to="/landing-v2"
            className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
          >
            ← Voltar à landing
          </Link>
          <Link
            to="/security"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Segurança e dados
          </Link>
          <Link
            to="/changelog"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Changelog
          </Link>
        </nav>
      </article>

      <MadeWithLoveFooter variant="default" />
    </main>
  );
}
