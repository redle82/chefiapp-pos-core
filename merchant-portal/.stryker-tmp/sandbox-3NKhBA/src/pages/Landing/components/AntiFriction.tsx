// @ts-nocheck
export const AntiFriction = () => {
  const traditional = [
    "Cadastro manual + validação",
    "Espera por contacto do suporte",
    "Demo Guide agendado (quando possível)",
    "Configuração feita por terceiros",
    "Alterações dependem de ticket",
    "Tempo total: dias ou semanas",
  ];

  const chefiapp = [
    "Criação imediata do restaurante",
    "Menu web criado em poucos cliques",
    "TPV e operação conectados no mesmo fluxo",
    "Equipa ativa em minutos",
    "Ajustes feitos por você, em tempo real",
    "Tempo total: minutos",
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            O que antes levava dias, agora leva minutos.
          </h2>
          <p className="text-lg text-muted">
            Não é má vontade. É modelo de negócio.
          </p>
        </div>

        <div className="glass-card max-w-5xl mx-auto p-10 relative overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 grid md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">
                Modelo tradicional de software para restauração
              </h3>
              <ul className="space-y-3 text-muted">
                {traditional.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-red-400 text-xl">❌</span>
                    <span className="text-base md:text-lg">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm md:text-base text-muted font-semibold">
                Cada passo cria dependência.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-primary">
                ChefIApp — sistema operacional direto
              </h3>
              <ul className="space-y-3 text-muted">
                {chefiapp.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-primary text-xl">•</span>
                    <span className="text-base md:text-lg text-white">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-sm md:text-base text-muted font-semibold">
                Sem intermediários. Sem espera.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-10 text-center space-y-3">
            <p className="text-lg md:text-xl text-white font-semibold">
              Quando o sistema é simples, o suporte deixa de ser uma armadilha.
            </p>
            <p className="text-muted">
              Menu web, TPV e operação não são produtos separados. No ChefIApp,
              eles nascem juntos. O mesmo sistema que cria o menu público ativa
              o TPV e organiza a operação interna. Um fluxo. Não três contratos.
            </p>
            <p className="text-muted/80 text-sm md:text-base">
              Se configurar um sistema exige horas de chamadas, o problema não é
              você. É o sistema.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
