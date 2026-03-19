/**
 * ProductShowcaseV2 — CSS-only product mockups for the three ChefIApp surfaces.
 * Replaces image-dependent InsideSystemV2 with inline HTML/CSS browser frames.
 * Copy via useLandingLocale (i18n/LandingLocaleContext).
 */
import React from "react";
import { useLandingLocale } from "../i18n/LandingLocaleContext";

/* ─── Browser frame chrome ─── */
const FrameToolbar: React.FC<{ url: string }> = ({ url }) => (
  <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-red-500/80" />
      <span className="h-2 w-2 rounded-full bg-amber-400/80" />
      <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
    </div>
    <div className="flex-1 mx-3 truncate rounded-md bg-black/60 border border-white/10 px-3 py-1.5 text-[11px] text-neutral-300 font-mono">
      {url}
    </div>
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
      Live
    </span>
  </div>
);

/* ─── Feature pill ─── */
const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-neutral-400 tracking-wide">
    {children}
  </span>
);

/* ═══════════════════════════════════════════════════
   Mockup 1 — TPV (Point of Sale)
   ═══════════════════════════════════════════════════ */
const MENU_ITEMS = [
  { emoji: "\u{1F957}", name: "Bruschetta", price: "\u20ac8.50" },
  { emoji: "\u{1F355}", name: "Margherita", price: "\u20ac12.00" },
  { emoji: "\u{1F969}", name: "Picanha", price: "\u20ac18.90" },
  { emoji: "\u{1F37D}\uFE0F", name: "Risotto", price: "\u20ac14.50" },
  { emoji: "\u{1F370}", name: "Cheesecake", price: "\u20ac6.00" },
  { emoji: "\u{1F377}", name: "Vinho Tinto", price: "\u20ac5.50" },
];
const ORDER_ITEMS = [
  { name: "Bruschetta", qty: 2, price: "\u20ac17.00" },
  { name: "Picanha", qty: 1, price: "\u20ac18.90" },
  { name: "Vinho Tinto", qty: 2, price: "\u20ac11.00" },
];

const TpvMockup: React.FC = () => (
  <div className="flex h-full min-h-[260px] md:min-h-[300px] text-[11px]">
    {/* Product grid */}
    <div className="flex-1 p-3 grid grid-cols-2 gap-2 content-start overflow-hidden">
      {MENU_ITEMS.map((item) => (
        <div
          key={item.name}
          className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5 flex flex-col items-center gap-1 hover:border-amber-500/30 transition-colors cursor-default"
        >
          <span className="text-lg leading-none">{item.emoji}</span>
          <span className="text-neutral-300 font-medium truncate w-full text-center text-[10px]">
            {item.name}
          </span>
          <span className="text-amber-400 font-semibold text-[10px]">{item.price}</span>
        </div>
      ))}
    </div>

    {/* Order panel */}
    <div className="w-[42%] border-l border-white/10 bg-black/40 flex flex-col">
      <div className="px-3 py-2 border-b border-white/[0.06]">
        <span className="text-neutral-500 font-semibold uppercase tracking-widest text-[9px]">
          Pedido #047
        </span>
      </div>
      <div className="flex-1 px-3 py-2 space-y-1.5 overflow-hidden">
        {ORDER_ITEMS.map((item) => (
          <div key={item.name} className="flex justify-between text-neutral-300">
            <span>
              <span className="text-neutral-500 mr-1">{item.qty}x</span>
              {item.name}
            </span>
            <span className="text-neutral-400">{item.price}</span>
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-white/[0.06] space-y-1">
        <div className="flex justify-between text-neutral-500">
          <span>Subtotal</span>
          <span>\u20ac46.90</span>
        </div>
        <div className="flex justify-between text-white font-semibold text-xs">
          <span>Total</span>
          <span>\u20ac46.90</span>
        </div>
      </div>
      <div className="p-3 pt-0">
        <div className="w-full rounded-lg bg-amber-500 text-black text-center py-2 font-semibold text-[11px] cursor-default">
          Finalizar Pedido
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   Mockup 2 — KDS (Kitchen Display)
   ═══════════════════════════════════════════════════ */
const KDS_ORDERS = [
  {
    table: "#Mesa 4",
    time: "05:12",
    status: "Urgente",
    color: "red" as const,
    items: ["2x Bruschetta", "1x Picanha"],
  },
  {
    table: "#Mesa 7",
    time: "02:30",
    status: "Em prep.",
    color: "amber" as const,
    items: ["1x Margherita", "1x Risotto", "2x Vinho"],
  },
  {
    table: "#Mesa 2",
    time: "00:45",
    status: "Pronto",
    color: "green" as const,
    items: ["1x Cheesecake", "1x Espresso"],
  },
];

const kdsColorMap = {
  red: {
    border: "border-red-500/40",
    badge: "bg-red-500/20 text-red-400",
    timer: "text-red-400",
    dot: "bg-red-400",
  },
  amber: {
    border: "border-amber-500/30",
    badge: "bg-amber-500/15 text-amber-400",
    timer: "text-amber-400",
    dot: "bg-amber-400",
  },
  green: {
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/15 text-emerald-400",
    timer: "text-emerald-400",
    dot: "bg-emerald-400",
  },
};

const KdsMockup: React.FC = () => (
  <div className="min-h-[260px] md:min-h-[300px] p-3 flex gap-2 overflow-hidden">
    {KDS_ORDERS.map((order) => {
      const c = kdsColorMap[order.color];
      return (
        <div
          key={order.table}
          className={`flex-1 rounded-xl border ${c.border} bg-white/[0.02] flex flex-col overflow-hidden`}
        >
          {/* header */}
          <div className="px-2.5 py-2 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-neutral-200 font-semibold text-[11px]">{order.table}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${c.badge}`}>
              <span className={`h-1 w-1 rounded-full ${c.dot}`} />
              {order.status}
            </span>
          </div>
          {/* items */}
          <div className="flex-1 px-2.5 py-2 space-y-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="text-[10px] text-neutral-400">
                {item}
              </div>
            ))}
          </div>
          {/* timer */}
          <div className={`px-2.5 py-2 border-t border-white/[0.06] text-center font-mono font-semibold text-xs ${c.timer}`}>
            {order.time}
          </div>
        </div>
      );
    })}
  </div>
);

/* ═══════════════════════════════════════════════════
   Mockup 3 — AppStaff (Mobile staff app)
   ═══════════════════════════════════════════════════ */
const STAFF_TASKS = [
  { table: "Mesa 3", status: "Pronto para servir", color: "emerald" as const },
  { table: "Mesa 7", status: "Em preparacao", color: "amber" as const },
  { table: "Mesa 12", status: "Aguarda pagamento", color: "blue" as const },
];

const staffColorMap = {
  emerald: "border-emerald-500/30 bg-emerald-500/5",
  amber: "border-amber-500/30 bg-amber-500/5",
  blue: "border-blue-500/30 bg-blue-500/5",
};
const staffDotMap = {
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  blue: "bg-blue-400",
};
const staffTextMap = {
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  blue: "text-blue-400",
};

const NAV_ITEMS = [
  { label: "POS", icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3" },
  { label: "Mesas", icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" },
  { label: "Cozinha", icon: "M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" },
  { label: "Tarefas", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

const StaffMockup: React.FC = () => (
  <div className="min-h-[260px] md:min-h-[300px] flex justify-center">
    {/* Phone container — narrower to suggest mobile */}
    <div className="w-full max-w-[260px] flex flex-col">
      {/* Operator header */}
      <div className="px-3 py-3 flex items-center gap-2.5 border-b border-white/[0.06]">
        <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">
          SM
        </div>
        <div>
          <p className="text-neutral-200 text-[11px] font-semibold leading-tight">Sofia Martins</p>
          <p className="text-neutral-500 text-[9px] leading-tight">Sala &middot; Turno 14h-22h</p>
        </div>
      </div>

      {/* Task cards */}
      <div className="flex-1 px-3 py-3 space-y-2 overflow-hidden">
        {STAFF_TASKS.map((task) => (
          <div
            key={task.table}
            className={`rounded-lg border ${staffColorMap[task.color]} px-3 py-2.5 cursor-default`}
          >
            <div className="flex items-center justify-between">
              <span className="text-neutral-200 text-[11px] font-semibold">{task.table}</span>
              <span className={`inline-flex items-center gap-1 text-[9px] font-medium ${staffTextMap[task.color]}`}>
                <span className={`h-1 w-1 rounded-full ${staffDotMap[task.color]}`} />
                {task.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="border-t border-white/[0.06] px-2 py-2 flex justify-around">
        {NAV_ITEMS.map((nav) => (
          <div key={nav.label} className="flex flex-col items-center gap-0.5 cursor-default">
            <svg
              className="w-4 h-4 text-neutral-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={nav.icon} />
            </svg>
            <span className="text-[8px] text-neutral-600">{nav.label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   Card descriptor data
   ═══════════════════════════════════════════════════ */
interface CardDescriptor {
  url: string;
  label: string;
  title: string;
  desc: string;
  pills: string[];
  Mockup: React.FC;
}

const CARDS: CardDescriptor[] = [
  {
    url: "chefiapp.com/tpv",
    label: "TPV Central",
    title: "Pedidos, pagamentos e recibos fiscais num unico ecra.",
    desc: "Interface desenhada para velocidade: produto, quantidade, pagamento. Sem menus escondidos, sem cliques desperdicados.",
    pills: ["Recibo fiscal", "Multi-pagamento", "ESC/POS"],
    Mockup: TpvMockup,
  },
  {
    url: "chefiapp.com/kds",
    label: "KDS Cozinha",
    title: "Pedidos em tempo real. Priorizacao automatica. Zero tickets perdidos.",
    desc: "Cada estacao ve apenas o que lhe compete. Temporizadores, cores e alertas sonoros garantem que nada atrasa.",
    pills: ["Tempo real", "Priorizacao", "Multi-estacao"],
    Mockup: KdsMockup,
  },
  {
    url: "chefiapp.com/staff",
    label: "AppStaff",
    title: "Cada membro da equipa ve exactamente o que precisa. Sem ruido.",
    desc: "Notificacoes por funcao, tarefas atribuidas e visao operacional adaptada ao papel de cada colaborador.",
    pills: ["Por funcao", "Alertas", "Mobile-first"],
    Mockup: StaffMockup,
  },
];

/* ═══════════════════════════════════════════════════
   Main section
   ═══════════════════════════════════════════════════ */
export const ProductShowcaseV2: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { locale: _ } = useLandingLocale();

  return (
    <section
      id="produto"
      className="py-24 md:py-32 bg-[#050505] relative overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-80px] w-96 h-96 bg-amber-400/5 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl mb-14 md:mb-20">
          <p className="text-amber-500 text-sm font-semibold tracking-[0.18em] uppercase mb-3">
            O SISTEMA EM AC&Ccedil;&Atilde;O
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-white">
            Tr&ecirc;s superf&iacute;cies.{" "}
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Uma verdade operacional.
            </span>
          </h2>
          <p className="text-neutral-400 text-base md:text-lg leading-relaxed">
            TPV, Cozinha e Equipa &mdash; tudo sincronizado em tempo real.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {CARDS.map((card) => (
            <div key={card.label} className="flex flex-col gap-5">
              {/* Browser frame */}
              <div className="group rounded-2xl border border-white/10 bg-[#050505] overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.02)] hover:border-amber-500/40 transition-all duration-300">
                <FrameToolbar url={card.url} />
                <div className="bg-black overflow-hidden">
                  <card.Mockup />
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-amber-500/80 uppercase tracking-[0.18em] mb-1.5">
                  {card.label}
                </p>
                <p className="text-sm md:text-base text-neutral-300 leading-relaxed mb-3">
                  {card.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {card.pills.map((pill) => (
                    <Pill key={pill}>{pill}</Pill>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
