/**
 * ProblemSolutionV2 — Problemas reais vs ChefIApp™ OS
 *
 * Liga vazamentos concretos a mecanismos específicos do sistema.
 */

type ProblemBlock = {
  title: string;
  lossLabel: string;
  without: string[];
  with: string[];
};

const PROBLEMS: ProblemBlock[] = [
  {
    title: "Pratos atrasados na cozinha",
    lossLabel: "Perda estimada: 3–6% por serviço",
    without: [
      "Pedidos acumulam-se sem prioridade clara.",
      "Garçons pressionam a cozinha; a equipa reage, não antecipa.",
      "Cliente reclama quando o problema já aconteceu.",
    ],
    with: [
      "KDS prioriza automaticamente pratos atrasados.",
      "Alertas surgem antes do atraso virar reclamação.",
      "O ritmo de serviço ajusta-se em tempo real, não no fecho.",
    ],
  },
  {
    title: "Stock acaba sem aviso",
    lossLabel: "Perda estimada: 2–5% em vendas perdidas",
    without: [
      "Equipa descobre que acabou um item só quando o cliente ou hóspede pede.",
      "Substituições de última hora baixam ticket médio.",
      "Compras são reactivas, não planeadas.",
    ],
    with: [
      "Stock ajusta a cada pedido registado no TPV.",
      "Alertas avisam antes de esgotar um produto crítico.",
      "Dono decide durante o serviço o que priorizar, não no dia seguinte.",
    ],
  },
  {
    title: "Dono cego durante o serviço",
    lossLabel: "Perda invisível: lucro sem dono",
    without: [
      "Perguntas clássicas: \"Quantos pedidos? Quanto já faturámos neste turno?\"",
      "Ninguém tem resposta em tempo real, só no fecho.",
      "Problemas só aparecem quando o cliente já reclamou.",
    ],
    with: [
      "Comando Central mostra faturação, mesas e equipa em tempo real.",
      "Alertas operacionais sinalizam gargalos antes do cliente sentir.",
      "Decisões são tomadas a meio do turno, não no relatório do dia seguinte.",
    ],
  },
  {
    title: "Equipa desorganizada em turnos",
    lossLabel: "Perda estimada: 10–15% em folha + erros",
    without: [
      "Turnos feitos \"de cabeça\"; ninguém sabe quem é responsável por quê.",
      "Picos de serviço com gente a menos; horas mortas com gente a mais.",
      "Performance individual nunca é ligada ao que aconteceu no serviço.",
    ],
    with: [
      "Turnos e pedidos vivem no mesmo sistema operacional, em vez de folhas soltas e memória.",
      "Cada membro da equipa vê só o que precisa fazer agora, sem listas genéricas infinitas.",
      "Responsabilidade clara: pedidos e mesas ligados a quem atendeu, sem caça às bruxas no fim do turno.",
    ],
  },
];

export const ProblemSolutionV2 = () => {
  return (
    <section className="py-24 md:py-32 bg-[#060606] relative overflow-hidden">
      {/* Glow subtil em desktop */}
      <div className="hidden md:block absolute -top-32 right-0 w-[420px] h-[420px] bg-amber-500/6 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Header */}
        <div className="max-w-3xl mb-16 md:mb-20">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-3">
            Problemas reais que fazem perder dinheiro
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            E como o sistema operacional fecha cada vazamento.
          </h2>
          <p className="text-neutral-400 text-lg leading-relaxed">
            Não é mais um software de gestão. É o cérebro operacional que liga
            pedidos, cozinha, stock, equipa e faturação no mesmo fluxo.
          </p>
        </div>

        <div className="space-y-6">
          {PROBLEMS.map((block) => (
            <div
              key={block.title}
              className="rounded-2xl border border-white/5 bg-neutral-950/70 overflow-hidden hover:border-amber-500/30 transition-all duration-300"
            >
              <div className="border-b border-white/5 px-6 md:px-8 py-5 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                    {block.title}
                  </h3>
                  <p className="text-xs text-neutral-500">{block.lossLabel}</p>
                </div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-amber-400">
                  Antes: caos silencioso · Depois: controlo em tempo real
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-px bg-white/5">
                {/* Sem sistema */}
                <div className="bg-neutral-950 px-6 md:px-8 py-6 md:py-7">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-[0.16em] mb-3">
                    Sem sistema operacional
                  </p>
                  <ul className="space-y-2.5 text-sm text-neutral-300">
                    {block.without.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500/70" />
                        <span className="leading-relaxed text-neutral-400">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Com ChefIApp */}
                <div className="bg-neutral-950 px-6 md:px-8 py-6 md:py-7">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-[0.16em] mb-3">
                    Com ChefIApp™ OS
                  </p>
                  <ul className="space-y-2.5 text-sm text-neutral-300">
                    {block.with.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

