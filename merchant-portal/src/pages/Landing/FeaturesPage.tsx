/**
 * PUBLIC_SITE_CONTRACT: /features — Site do sistema (marketing).
 * NÃO carrega Runtime nem Core. Funciona offline.
 */
import { Link } from "react-router-dom";

const FEATURE_GROUPS = [
  {
    title: "Operação no salão",
    items: [
      "TPV com fluxo mesa, balcão e takeaway",
      "Divisão de conta, desconto e fechamento rápido",
      "Estado de pedidos em tempo real",
      "Atalhos de operação para pico de serviço",
    ],
  },
  {
    title: "Cozinha e despacho",
    items: [
      "KDS em tempo real com priorização visual",
      "Marcação de pronto e histórico de tempo",
      "Sincronização imediata TPV ↔ cozinha",
      "Visibilidade por estação/equipa",
    ],
  },
  {
    title: "AppStaff e equipa",
    items: [
      "Home por função (owner, manager, waiter, kitchen)",
      "Alertas operacionais e tarefas por contexto",
      "Modo scanner para inventário",
      "Experiência mobile-first para operação diária",
    ],
  },
  {
    title: "Gestão e controlo",
    items: [
      "Dashboard com métricas de operação",
      "Catálogo, produtos, modificadores e combos",
      "Clientes, reservas e promoções",
      "Configuração de dispositivos e impressão",
    ],
  },
  {
    title: "Pagamentos e faturação",
    items: [
      "Fluxos de billing no painel administrativo",
      "Controlo de estado de pagamento",
      "Proteções de acesso por estado de faturação",
      "Estrutura preparada para expansão de gateways",
    ],
  },
  {
    title: "Infra e confiabilidade",
    items: [
      "Arquitetura orientada a operação real",
      "Suporte a modo trial/piloto/operacional",
      "Guardrails de rotas e contratos de sistema",
      "Base para PWA e evolução para apps nativas",
    ],
  },
];

export function FeaturesPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-5 py-12 text-neutral-100 md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-9 text-center">
          <Link
            to="/landing"
            className="mb-3 inline-block text-xs text-neutral-400 no-underline hover:text-neutral-200"
          >
            ← Voltar à landing oficial
          </Link>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight md:text-4xl">
            Funcionalidades do ChefIApp
          </h1>
          <p className="mx-auto max-w-3xl text-base leading-relaxed text-neutral-400">
            Página oficial de capacidades do sistema: operação no salão,
            cozinha, AppStaff, gestão, faturação e confiabilidade da operação.
          </p>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FEATURE_GROUPS.map((group) => (
            <article
              key={group.title}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <h2 className="mb-2.5 text-lg font-bold">{group.title}</h2>
              <ul className="grid gap-2 pl-5 text-sm leading-relaxed text-neutral-400">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4">
          <p className="m-0 text-sm text-neutral-400">
            Quer ver o posicionamento técnico por capacidade? Compare em detalhe
            com players do mercado.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/compare"
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2.5 text-sm text-neutral-100 no-underline hover:bg-neutral-700"
            >
              Ver comparativo técnico
            </Link>
            <Link
              to="/pricing"
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2.5 text-sm text-neutral-100 no-underline hover:bg-neutral-700"
            >
              Ver planos
            </Link>
            <Link
              to="/auth/email"
              className="rounded-lg bg-amber-500 px-3.5 py-2.5 text-sm font-bold text-neutral-900 no-underline hover:bg-amber-400"
            >
              Começar agora
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
