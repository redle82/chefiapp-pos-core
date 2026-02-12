export const HardObjectionsV2 = () => {
  const ITEMS = [
    {
      q: "E se a equipa resistir ao sistema?",
      a: "O OS foi pensado para quem está em serviço, não para quem gosta de software. Cada perfil vê só o que precisa naquele momento — TPV simples, KDS claro, staff app com poucos botões. Restaurantes reais já estão a operar sem formação externa pesada; a curva é mais curta do que trocar um POS.",
    },
    {
      q: "E se o Wi‑Fi cair a meio do serviço?",
      a: "O ChefIApp™ aguenta interrupções curtas de rede: o serviço não pára por uma queda rápida. Para pagamento e fecho de caixa continua a precisar de internet activa, mas o foco do OS é reduzir caos durante o turno, não criar mais um ponto único de falha.",
    },
    {
      q: "E se eu já tiver um POS fiscal?",
      a: "Mantém o POS fiscal. O ChefIApp™ OS hoje trabalha em paralelo: gere operação, pré‑conta e serviço em tempo real; o POS continua responsável pela nota. Quando a certificação fiscal estiver activa, decides se queres unificar — até lá não há ruptura, só ganho operacional.",
    },
    {
      q: "E se eu quiser sair depois de testar?",
      a: "Sai quando quiser. Sem fidelização, sem multa. Cancelas no painel e exportas os teus dados primeiro — são teus. O objetivo do piloto é provar valor em serviço real, não te prender por contrato.",
    },
    {
      q: "E se a equipa for sazonal e mudar todos os meses?",
      a: "É precisamente aí que um sistema operacional faz diferença. Interfaces simples, fluxo único entre sala, cozinha e caixa e menos dependência de uma pessoa que “sabe tudo de cabeça”. Cada novo elemento aprende observando o serviço, não decorando um manual.",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-neutral-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-0 w-72 h-72 bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-40px] w-80 h-80 bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6">
        <div className="max-w-3xl mb-10 md:mb-14">
          <p className="text-amber-500 text-sm font-semibold tracking-[0.18em] uppercase mb-3">
            Objeções duras respondidas
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            As perguntas que realmente travam a decisão.
          </h2>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
            Estas são as dúvidas que donos e gerentes fazem antes de dizer
            “sim”. Respondemos com o sistema de hoje, não com o roadmap.
          </p>
        </div>

        <div className="space-y-4">
          {ITEMS.map((item) => (
            <div
              key={item.q}
              className="rounded-2xl border border-white/10 bg-neutral-900/60 px-5 py-4 md:px-6 md:py-5"
            >
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.18em] mb-1.5">
                {item.q}
              </p>
              <p className="text-sm text-neutral-200 leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

