/**
 * MoneyLeaksV2 — Mapa de vazamentos de dinheiro
 *
 * Mostra onde um restaurante típico perde margem sem ver
 * e faz a ponte para a narrativa operacional.
 */

const LEAKS = [
  {
    label: "Erros de pedido",
    range: "2–4% da faturação",
    description:
      "Pratos refeitos, itens trocados, comandas confusas entre sala e cozinha.",
  },
  {
    label: "Tempo morto de mesa",
    range: "5–8% do potencial",
    description:
      "Mesas paradas à espera de pedido, sobremesa ou conta. Menos voltas por serviço.",
  },
  {
    label: "Stock mal controlado",
    range: "3–6% em desperdício",
    description:
      "Produto a mais que estraga, produto a menos que impede vender quando a casa enche.",
  },
  {
    label: "Turnos desbalanceados",
    range: "10–15% em folha e stress",
    description:
      "Gente a mais nas horas mortas, gente a menos na hora crítica. Mais erros, mais burnout.",
  },
  {
    label: "Faturação invisível durante o serviço",
    range: "Lucro sem dono",
    description:
      "O dono só vê o resultado no fim do dia. Nunca consegue corrigir a meio do serviço.",
  },
];

export const MoneyLeaksV2 = () => {
  return (
    <section className="py-24 md:py-32 bg-neutral-950 relative overflow-hidden">
      {/* Ambient glow leve apenas em desktop */}
      <div className="hidden md:block absolute top-1/2 -left-40 w-[420px] h-[420px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* Header */}
        <div className="max-w-3xl mb-14 md:mb-20">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-3">
            Onde o dinheiro se perde sem ninguém ver
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Um restaurante não quebra num dia.
            <br />
            <span className="bg-linear-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              Ele sangra todos os dias.
            </span>
          </h2>
          <p className="text-neutral-400 text-lg leading-relaxed">
            Cada serviço parece “correto” — mas pequenos vazamentos operacionais
            somam milhares de euros por mês. Este é o mapa desses vazamentos.
          </p>
        </div>

        {/* Grid de vazamentos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
          {LEAKS.map((leak, index) => (
            <div
              key={leak.label}
              className="group relative p-6 rounded-2xl border border-white/5 bg-[#0b0b0b] hover:border-amber-500/30 hover:bg-neutral-900/80 transition-all duration-300"
            >
              <div className="flex items-baseline justify-between mb-3 gap-2">
                <h3 className="text-base font-semibold text-white">
                  {leak.label}
                </h3>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {leak.range}
                </span>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed">
                {leak.description}
              </p>
              <div className="mt-4 h-px bg-linear-to-r from-amber-500/0 via-amber-500/40 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                {index === 0 &&
                  "Lucro a escorrer em silêncio."}
                {index === 1 &&
                  "Margem que desaparece sem ninguém notar."}
                {index === 2 &&
                  "Dinheiro que nunca chega ao banco."}
                {index === 3 &&
                  "Perda invisível, turno após turno."}
                {index === 4 &&
                  "Lucro que se perde mês após mês."}
              </p>
            </div>
          ))}
        </div>

        {/* Síntese financeira agregada */}
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 px-5 py-5 md:px-8 md:py-6 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
          <div className="shrink-0">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-[0.16em] mb-1">
              Exemplo realista
            </p>
            <p className="text-2xl md:text-3xl font-black bg-linear-to-b from-white to-neutral-400 bg-clip-text text-transparent">
              €80.000 / mês
            </p>
            <p className="text-xs text-neutral-500 mb-3">
              Restaurante em casa cheia
            </p>
            <p className="text-xl md:text-2xl font-black bg-linear-to-b from-amber-300 to-amber-500 bg-clip-text text-transparent">
              €8.400 / mês
            </p>
            <p className="text-[11px] text-neutral-500">
              Margem recuperável que hoje não chega ao banco.
            </p>
          </div>
          <div className="flex-1 text-sm text-neutral-300 leading-relaxed">
            <p className="mb-1">
              Combinando estes vazamentos, um restaurante deste porte pode estar
              a perder entre{" "}
              <span className="font-semibold text-amber-400">
                €6.000 e €12.000 por mês
              </span>{" "}
              em margem que nunca aparece no fecho de caixa.
            </p>
            <p className="text-neutral-500">
              O ChefIApp™ OS existe para fechar estes vazamentos —{" "}
              <span className="text-neutral-300">
                durante o serviço, não depois.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

