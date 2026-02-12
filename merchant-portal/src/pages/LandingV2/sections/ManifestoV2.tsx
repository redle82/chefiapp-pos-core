/**
 * ManifestoV2 — "Por que isto é um Sistema Operacional?"
 *
 * Two-part section:
 * 1. "Before" column: 5 disconnected tools every restaurant uses
 * 2. "After": ChefIApp™ OS as one unified brain
 *
 * No emojis. Clean visual markers. Dramatic before/after contrast.
 */

const BEFORE_ITEMS = [
  "Um POS isolado",
  "Um app de reservas separado",
  "WhatsApp para a equipa",
  "Papel na cozinha",
  "Excel depois do turno",
];

const OS_REASONS = [
  {
    title: "Todos os componentes partilham o mesmo cérebro",
    desc: "Um pedido afecta stock, faturação, KDS, analytics e equipa — ao mesmo tempo.",
  },
  {
    title: "Um evento afecta todo o sistema",
    desc: "Quando um empregado marca turno, a sala, os pedidos e as tarefas ajustam-se sozinhas.",
  },
  {
    title: "Nada precisa ser integrado depois",
    desc: "Sem APIs de terceiros, sem conectores, sem sincronizações nocturnas. Tudo nasce ligado.",
  },
];

export const ManifestoV2 = () => {
  return (
    <section className="py-24 md:py-32 bg-[#0a0a0a] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header — centered */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Por que isto é um{" "}
            <span className="text-amber-500">Sistema Operacional?</span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">
            A maioria dos restaurantes cola 5 ferramentas separadas e espera que
            funcionem juntas. Nunca funcionam.
          </p>
        </div>

        {/* Before / After */}
        <div className="grid md:grid-cols-2 gap-0 rounded-2xl border border-white/5 overflow-hidden mb-16">
          {/* Before */}
          <div className="bg-neutral-900/20 p-8 md:p-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-2 h-2 rounded-full bg-red-400/60" />
              <h3 className="text-xs font-semibold text-red-400/80 uppercase tracking-wider">
                A realidade de hoje
              </h3>
            </div>
            <div className="space-y-4">
              {BEFORE_ITEMS.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <svg
                    className="w-4 h-4 text-red-400/50 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span className="text-base text-neutral-500 line-through decoration-red-400/30">
                    {item}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-sm text-neutral-600">
                5 ferramentas. 5 logins. Zero ligação entre elas.
              </p>
            </div>
          </div>

          {/* After */}
          <div className="bg-amber-500/[0.03] border-l border-white/5 p-8 md:p-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                Com o ChefIApp™ OS
              </h3>
            </div>
            <p className="text-xl font-bold text-white mb-8 leading-relaxed">
              Tudo isso vira um único cérebro operacional.
            </p>
            <div className="space-y-6">
              {OS_REASONS.map((r, i) => (
                <div key={r.title}>
                  <div className="flex items-start gap-3 mb-1">
                    <svg
                      className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    <div>
                      <h4 className="text-base font-semibold text-white mb-1">
                        {r.title}
                      </h4>
                      <p className="text-sm text-neutral-400 leading-relaxed">
                        {r.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Anchor callout */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent py-10 px-8">
            <p className="text-2xl md:text-3xl font-bold text-white leading-snug mb-3">
              Um restaurante não precisa de 5 sistemas.
            </p>
            <p className="text-2xl md:text-3xl font-bold text-amber-500 leading-snug">
              Precisa de um sistema operacional.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
