import React, { useEffect, useState } from "react";

type BrowserFrameProps = {
  url: string;
  statusLabel?: string;
  imageSrc: string;
  imageAlt: string;
};

const BrowserFrame: React.FC<BrowserFrameProps> = ({
  url,
  statusLabel = "Online",
  imageSrc,
  imageAlt,
}) => {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-[#050505] overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.02)] hover:border-amber-500/40 transition-all duration-300">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500/80" />
          <span className="h-2 w-2 rounded-full bg-amber-400/80" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
        </div>
        <div className="flex-1 mx-3 truncate rounded-md bg-black/60 border border-white/10 px-3 py-1.5 text-[11px] text-neutral-300 font-mono">
          {url}
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {statusLabel}
        </span>
      </div>
      <div className="relative bg-black">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-500"
          loading="lazy"
        />
      </div>
    </div>
  );
};

const useCountUp = (target: number, durationMs: number) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const steps = 30;
    const stepDuration = durationMs / steps;
    let currentStep = 0;

    const id = window.setInterval(() => {
      currentStep += 1;
      const progress = Math.min(currentStep / steps, 1);
      const next = Math.round(target * progress);
      setValue(next);
      if (progress >= 1) {
        window.clearInterval(id);
      }
    }, stepDuration);

    return () => window.clearInterval(id);
  }, [target, durationMs]);

  return value;
};

export const InsideSystemV2: React.FC = () => {
  const liveOrders = useCountUp(47, 1400);

  return (
    <section className="py-24 md:py-32 bg-[#050505] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-80px] w-96 h-96 bg-amber-400/5 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mb-12 md:mb-16">
          <p className="text-amber-500 text-sm font-semibold tracking-[0.18em] uppercase mb-3">
            Veja o sistema em funcionamento
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Não é promessa.
            <br />
            É o que você vê quando entra.
          </h2>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed mb-2">
            Estas não são maquetes genéricas. São telas reais do ChefIApp™ OS:
            o comando central, o TPV em serviço e a cozinha a trabalhar em
            tempo real sobre o mesmo cérebro operacional.
          </p>
          <p className="text-[11px] md:text-xs text-neutral-500 uppercase tracking-[0.22em]">
            Telas reais em ambiente de demonstração — o mesmo sistema usado em
            restaurantes independentes, grupos e operações de hotelaria.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7 mb-14">
          <div className="flex flex-col gap-4">
            <BrowserFrame
              url="chefiapp.com/admin"
              statusLabel="Online"
              imageSrc="/landing/system/dashboard-live.png"
              imageAlt="Dashboard operacional do ChefIApp™ com pedidos, receita e tempo médio em tempo real."
            />
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.18em] mb-1.5">
                Comando central
              </p>
              <h3 className="text-sm md:text-base font-semibold text-white mb-1">
                Dashboard ao vivo por turno
              </h3>
              <p className="text-xs md:text-sm text-neutral-400 leading-relaxed mb-2">
                Pedidos em curso, tempo médio de saída, receita do dia e risco
                operacional visíveis num só painel — durante o serviço, não no
                fecho de caixa.
              </p>
              <div className="inline-flex items-baseline gap-1 rounded-full border border-amber-500/30 bg-amber-500/5 px-2.5 py-1">
                <span className="text-[11px] font-semibold text-amber-300">
                  {liveOrders}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-amber-400">
                  pedidos ativos neste turno
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <BrowserFrame
              url="chefiapp.com/tpv"
              statusLabel="Em serviço"
              imageSrc="/landing/system/tpv-order.png"
              imageAlt="Ecrã do TPV do ChefIApp™ com pedido em criação, itens, totais e formas de pagamento."
            />
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.18em] mb-1.5">
                Frente de casa
              </p>
              <h3 className="text-sm md:text-base font-semibold text-white mb-1">
                TPV a lançar pedidos em tempo real
              </h3>
              <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
                Cada item lançado no TPV nasce ligado ao menu vivo — com preços,
                modificadores e impostos certos — pronto para seguir para
                cozinha sem ruído.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-1 md:col-span-2">
            <BrowserFrame
              url="chefiapp.com/kds"
              statusLabel="Cozinha em fluxo"
              imageSrc="/landing/system/kds-priority.png"
              imageAlt="Ecrã do KDS do ChefIApp™ com vários pedidos e prioridades visíveis para a equipa de cozinha."
            />
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.18em] mb-1.5">
                Cozinha e controlo
              </p>
              <h3 className="text-sm md:text-base font-semibold text-white mb-1">
                Prioridade automática e controlo de atraso
              </h3>
              <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
                A cozinha vê o que importa: ordem, status, tempo a contar e
                alertas visuais — seja no serviço de jantar ou num pequeno-
                almoço de hotel com sala cheia.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-10 md:mb-12">
          <div className="grid md:grid-cols-3 gap-3 md:gap-4 text-xs md:text-sm text-neutral-300">
            <div className="rounded-xl border border-white/10 bg-neutral-950/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 mb-1.5">
                Configuração de menu
              </p>
              <p className="font-semibold text-white mb-1">Menu Builder</p>
              <p className="text-[11px] text-neutral-400 leading-relaxed mb-1.5">
                Categorias, pratos, margens e modificadores em um só lugar —
                pronto para alimentar TPV, KDS e página pública.
              </p>
              <p className="text-[10px] text-neutral-500">
                Screenshot: <span className="font-mono">menu-builder.png</span>
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-neutral-950/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 mb-1.5">
                Turnos e equipas
              </p>
              <p className="font-semibold text-white mb-1">
                Staff &amp; turnos
              </p>
              <p className="text-[11px] text-neutral-400 leading-relaxed mb-1.5">
                Perfis, papéis e horários por turno — seja equipa de sala,
                cozinha ou F&amp;B de hotel com vários outlets.
              </p>
              <p className="text-[10px] text-neutral-500">
                Screenshot: <span className="font-mono">staff-config.png</span>
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-neutral-950/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 mb-1.5">
                Analytics operacional
              </p>
              <p className="font-semibold text-white mb-1">
                Gráficos e margens
              </p>
              <p className="text-[11px] text-neutral-400 leading-relaxed mb-1.5">
                Visão consolidada por turno, por canal e por outlet — restaurante,
                bar, rooftop ou room service.
              </p>
              <p className="text-[10px] text-neutral-500">
                Screenshot: <span className="font-mono">analytics-ops.png</span>
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/60 px-5 py-5 md:px-7 md:py-6 mb-5 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
            <div className="max-w-sm">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-[0.2em] mb-2">
                Da configuração à venda
              </p>
              <h3 className="text-base md:text-lg font-semibold text-white mb-1.5">
                O mesmo sistema liga configuração, serviço e controlo de margem.
              </h3>
              <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
                Não são ferramentas soltas. O menu que você configura é o mesmo
                que aparece no TPV, que alimenta a cozinha e que fecha no
                dashboard do gerente.
              </p>
            </div>

            <div className="flex-1">
              <ol className="grid md:grid-cols-4 gap-3 md:gap-4 text-xs md:text-sm text-neutral-300">
                <li className="relative rounded-xl border border-white/10 bg-neutral-950/80 px-3 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 mb-2">
                    01 · Configuração
                  </div>
                  <p className="font-semibold text-white mb-1">
                    Menu Builder
                  </p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Defina preços, margens e modificadores em segundos — sem
                    depender de técnico ou suporte externo.
                  </p>
                  <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 hidden md:inline-flex h-px w-3 bg-linear-to-r from-amber-400/0 via-amber-400 to-amber-400/0" />
                </li>

                <li className="relative rounded-xl border border-white/10 bg-neutral-950/80 px-3 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 mb-2">
                    02 · Serviço
                  </div>
                  <p className="font-semibold text-white mb-1">TPV em uso</p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    O prato entra em serviço com o menu vivo — cada pedido certo
                    à primeira, sem gambiarras na frente de casa.
                  </p>
                  <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 hidden md:inline-flex h-px w-3 bg-linear-to-r from-amber-400/0 via-amber-400 to-amber-400/0" />
                </li>

                <li className="relative rounded-xl border border-white/10 bg-neutral-950/80 px-3 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 mb-2">
                    03 · Produção
                  </div>
                  <p className="font-semibold text-white mb-1">KDS / Cozinha</p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Prioridade automática, tempo a contar e visibilidade por
                    estação — a equipa sabe sempre qual é o próximo prato.
                  </p>
                  <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 hidden md:inline-flex h-px w-3 bg-linear-to-r from-amber-400/0 via-amber-400 to-amber-400/0" />
                </li>

                <li className="rounded-xl border border-white/10 bg-neutral-950/80 px-3 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 mb-2">
                    04 · Controle
                  </div>
                  <p className="font-semibold text-white mb-1">
                    Dashboard / Analytics
                  </p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    O turno fecha com números reais de margem, tempo e
                    produtividade — não com sensação vaga de que \"correu bem\".
                  </p>
                </li>
              </ol>
            </div>
          </div>
        </div>

        <div className="mt-4 md:mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <p className="text-[11px] md:text-xs text-neutral-500">
            Quer ver estas telas com os seus próprios dados? Em menos de um
            turno já é possível testar o sistema operacional completo.
          </p>
          <a
            href="/auth/phone"
            className="inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-xs md:text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            Quero ver isto com os meus dados
          </a>
        </div>
      </div>
    </section>
  );
};

