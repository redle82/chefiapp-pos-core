/**
 * OperationalStoriesV2 — "O restaurante em funcionamento"
 *
 * Three real-scenario blocks with timeline visual.
 * No emojis — numbered scenario markers + SVG accents.
 * Shows what happens minute-by-minute when ChefIApp™ OS is running.
 */

const SCENARIOS = [
  {
    num: "01",
    title: "Um pedido entra no TPV",
    intro: "Sexta-feira, 13h. Casa a encher.",
    steps: [
      "Aparece na cozinha (KDS) — instantaneamente",
      "O stock ajusta-se automaticamente",
      "A faturação actualiza em tempo real",
      "Fica associado ao empregado que serviu",
      "Entra nas estatísticas do dia",
    ],
    anchor:
      "Sem integrações. Sem sincronizações. Um único sistema operacional.",
  },
  {
    num: "02",
    title: "A cozinha vê prioridades, não papel",
    intro: "Sábado à noite. 18 mesas ocupadas.",
    steps: [
      "Pratos atrasados são sinalizados automaticamente",
      "Gargalos aparecem antes de virarem problema",
      "O ritmo do serviço ajusta-se sozinho",
      "O chef vê tempo real, não papel pendurado",
    ],
    anchor: "A cozinha opera com informação, não com suposição.",
  },
  {
    num: "03",
    title: "O gerente sabe tudo — sem perguntar",
    intro: "Ele abre o Comando Central e vê:",
    steps: [
      "Faturação em tempo real",
      "Mesas activas e tempo médio de serviço",
      "Equipa em turno — quem está, quem falta",
      "Alertas operacionais antes que o cliente reclame",
    ],
    anchor: "Tudo no Comando Central. Zero perguntas no corredor.",
  },
];

export const OperationalStoriesV2 = () => {
  return (
    <section className="py-24 md:py-32 bg-neutral-950 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/3 rounded-full blur-[120px] pointer-events-none" />

      <div
        className="max-w-7xl mx-auto px-6 relative"
        data-visual-slot="service-in-motion"
      >
        {/* Header — left-aligned for variety */}
        <div className="max-w-2xl mb-16 md:mb-20">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
            O restaurante em funcionamento
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            O que acontece na prática.
          </h2>
          <p className="text-neutral-400 text-lg leading-relaxed mb-3">
            Imagine um serviço real. Sexta-feira. Casa cheia. Ou um hotel a 92%
            de ocupação: pequeno-almoço lotado, bar cheio, room service ativo.
            Tudo parece funcionar — até começar a falhar.
          </p>
          <p className="text-neutral-500 text-sm leading-relaxed max-w-xl">
            O cliente ou hóspede espera. A cozinha discute. O gerente pergunta
            “o que está a acontecer?”. Ninguém tem resposta. É aqui que
            restaurantes e hotéis começam a sangrar dinheiro.
          </p>
        </div>

        {/* Scenario blocks — stacked with timeline connector */}
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="hidden lg:block absolute left-[60px] top-0 bottom-0 w-px bg-linear-to-b from-amber-500/40 via-amber-500/20 to-transparent" />

          <div className="space-y-6">
            {SCENARIOS.map((s) => (
              <div key={s.num} className="group relative lg:pl-32">
                {/* Timeline number marker */}
                <div className="hidden lg:flex absolute left-0 top-8 w-30 items-center">
                  <div className="w-12 h-12 rounded-full border-2 border-amber-500/40 bg-[#0a0a0a] flex items-center justify-center group-hover:border-amber-500 transition-colors z-10 relative left-9">
                    <span className="text-sm font-bold text-amber-500">
                      {s.num}
                    </span>
                  </div>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] overflow-hidden hover:border-amber-500/20 transition-all duration-300">
                  <div className="grid lg:grid-cols-[1fr,1.2fr]">
                    {/* Left — scenario context */}
                    <div className="p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/5">
                      <div className="lg:hidden flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full border-2 border-amber-500/40 flex items-center justify-center">
                          <span className="text-xs font-bold text-amber-500">
                            {s.num}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          Cenário {s.num}
                        </span>
                      </div>
                      <h3 className="text-xl lg:text-2xl font-bold text-white leading-snug mb-3">
                        {s.title}
                      </h3>
                      <p className="text-neutral-500 text-sm mb-6">{s.intro}</p>
                      {/* Anchor */}
                      <div className="py-3 px-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                        <p className="text-xs font-medium text-amber-500 leading-relaxed">
                          {s.anchor}
                        </p>
                      </div>
                    </div>

                    {/* Right — steps */}
                    <div className="p-8 lg:p-10">
                      <div className="space-y-4">
                        {s.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-4">
                            <div className="mt-0.5 w-6 h-6 rounded-md bg-neutral-800 flex items-center justify-center shrink-0 border border-white/5">
                              <span className="text-[10px] font-bold text-neutral-400">
                                {i + 1}
                              </span>
                            </div>
                            <span className="text-sm text-neutral-300 leading-relaxed pt-0.5">
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section closer */}
        <div className="mt-16 text-center">
          <p className="text-neutral-600 text-sm max-w-xl mx-auto">
            Cada evento está ligado a todo o resto — automaticamente.
          </p>
        </div>
      </div>
    </section>
  );
};
