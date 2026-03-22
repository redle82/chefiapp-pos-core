/**
 * PUBLIC_SITE_CONTRACT: /features — Site do sistema (marketing).
 * NÃO carrega Runtime nem Core. Funciona offline.
 *
 * Design system: bg-[#0b0b0f], glassmorphism cards, amber-500 accent.
 *
 * 130+ funcionalidades organizadas em 12 módulos.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Monitor,
  ChefHat,
  Smartphone,
  BarChart3,
  CreditCard,
  Shield,
  Users,
  CalendarDays,
  ShoppingCart,
  Package,
  Bell,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface FeatureGroup {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
}

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    icon: Monitor,
    title: "TPV — Ponto de Venda",
    description: "O coração operacional do restaurante",
    features: [
      "Venda em mesa, balcão e takeaway",
      "Divisão de conta inteligente",
      "Descontos e promoções por produto",
      "Atalhos de pico configuráveis",
      "Estado de pedidos em tempo real",
      "Quick Order — pedido rápido sem mesa",
      "Multi-método de pagamento por pedido",
      "Fecho de caixa auditável",
      "Modo offline — funciona sem internet",
      "Ecrã de cliente integrado",
    ],
  },
  {
    icon: ChefHat,
    title: "KDS — Ecrã de Cozinha",
    description: "Despacho inteligente sem papel",
    features: [
      "Pedidos em tempo real no ecrã",
      "Marcação de pronto por item",
      "Sincronização TPV ↔ Cozinha",
      "Visibilidade por estação (cozinha, bar, expo)",
      "Tempo de preparação por pedido",
      "Alertas de pedidos atrasados",
      "Ecrã de expedição dedicado",
      "Ecrã de delivery separado",
      "Histórico de tempos por prato",
    ],
  },
  {
    icon: Smartphone,
    title: "AppStaff — App da Equipa",
    description: "6 apps numa só para toda a equipa",
    features: [
      "Clock-in via QR code",
      "Tarefas por função e turno",
      "Dashboard do manager",
      "Dashboard do dono/owner",
      "Dashboard de cozinha",
      "Dashboard de operação",
      "Dashboard de tarefas",
      "Dashboard de limpeza",
      "Comunicação interna",
      "Métricas pessoais de desempenho",
      "Scanner mode para inventário",
      "Checklists de abertura/fecho",
      "Notificações push em tempo real",
      "Histórico pessoal de turnos",
    ],
  },
  {
    icon: BarChart3,
    title: "Dashboard e Análise",
    description: "Visão total do negócio em tempo real",
    features: [
      "Dashboard do dono com KPIs do dia",
      "Relatórios automáticos de vendas",
      "Histórico de turnos e caixas",
      "Relatórios por período personalizável",
      "Exportação CSV de qualquer relatório",
      "Métricas por produto e categoria",
      "Análise de horários de pico",
      "Controlo de desperdício",
    ],
  },
  {
    icon: CreditCard,
    title: "Pagamentos",
    description: "Todos os métodos, zero taxas extra",
    features: [
      "Dinheiro, cartão, MB WAY",
      "Stripe integrado nativamente",
      "Pagamento parcial / divisão",
      "Reconciliação automática",
      "Fecho de caixa com auditoria",
      "Recibos fiscais automáticos",
      "Compliance fiscal PT/ES",
      "Sem taxa por transacção do ChefiApp",
    ],
  },
  {
    icon: CalendarDays,
    title: "Reservas",
    description: "Sistema de reservas integrado, sem terceiros",
    features: [
      "Motor de reservas nativo",
      "Gestão de slots e capacidade",
      "Confirmação automática",
      "Controlo de no-show",
      "Integrado com o mapa de mesas",
      "Visível na página pública do restaurante",
    ],
  },
  {
    icon: Package,
    title: "Inventário Avançado",
    description: "Controlo de stock com inteligência operacional",
    features: [
      "Motor de inventário completo",
      "Mapeamento de receitas → ingredientes",
      "Rastreio de desperdício (WasteTracking)",
      "HungerEngine — previsão de consumo",
      "MetabolicEngine — metabolismo do restaurante",
      "Inventário automatizado por vendas",
      "Lista de compras automática",
      "Alertas de stock baixo",
    ],
  },
  {
    icon: ShoppingCart,
    title: "Pedidos Online e QR",
    description: "Canais digitais sem comissões",
    features: [
      "Pedidos via QR code na mesa",
      "Página pública do restaurante",
      "Menu digital acessível por link",
      "Pedidos takeaway online",
      "Tracking de estado pelo cliente",
      "Sem comissão por pedido",
    ],
  },
  {
    icon: Bell,
    title: "Alertas e Notificações",
    description: "O sistema avisa antes que o problema aconteça",
    features: [
      "Motor de alertas com runbooks",
      "Thresholds configuráveis",
      "Alertas operacionais em tempo real",
      "Notificações push para staff",
      "Notificações por email",
      "Templates de email profissionais",
      "Alertas de pedidos atrasados",
      "Alertas de stock crítico",
    ],
  },
  {
    icon: Trophy,
    title: "Gamificação e Loyalty",
    description: "Fidelização de clientes e motivação da equipa",
    features: [
      "Sistema de pontos de fidelidade",
      "Programa de loyalty integrado",
      "Gamificação para staff (XP, badges)",
      "Sessões com pontuação",
      "Métricas de desempenho gamificadas",
      "Widget de XP no AppStaff",
    ],
  },
  {
    icon: Users,
    title: "Gestão de Equipa",
    description: "Pessoas, turnos, funções e permissões",
    features: [
      "Gestão completa de funcionários",
      "Turnos e escalas",
      "Papéis e permissões por função",
      "Clock-in/out com QR",
      "Histórico de presenças",
      "Tarefas atribuídas por turno",
      "Colaboração em tempo real",
      "Pulse — estado da equipa ao vivo",
    ],
  },
  {
    icon: Shield,
    title: "Infraestrutura e Segurança",
    description: "Arquitectura de nível enterprise",
    features: [
      "RLS — isolamento total por restaurante",
      "Offline-first (PWA completa)",
      "Multi-idioma nativo (PT, EN, ES, FR)",
      "Multi-currency",
      "Multi-unidade / multi-localização",
      "Feature flags por restaurante",
      "Actualizações contínuas sem downtime",
      "Audit trail completo",
      "Encriptação TLS",
      "Funciona em qualquer device",
      "Sem hardware proprietário",
      "API e contratos abertos",
      "Impressão térmica integrada",
      "5+ ecrãs dedicados (Kitchen, Bar, Expo, Delivery, Customer)",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function FeaturesPage() {
  useEffect(() => {
    document.title = "Funcionalidades — ChefiApp™ OS";
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let tag = document.querySelector(
        `meta[${attr}="${name}"]`,
      ) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };
    setMeta(
      "description",
      "Todas as funcionalidades do ChefiApp: TPV, KDS, AppStaff, reservas, inventário, gamificação, loyalty, alertas e muito mais. Tudo incluído num só plano.",
    );
    setMeta(
      "og:title",
      "Funcionalidades — ChefiApp™ OS",
      true,
    );
    setMeta(
      "og:description",
      "130+ funcionalidades num sistema operacional completo para restaurantes.",
      true,
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-amber-500/3 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0b0b0f]/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between h-14">
          <Link
            to="/"
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            ChefiApp™ OS
          </Link>
          <Link
            to="/auth/email"
            className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors"
          >
            Começar grátis
          </Link>
        </div>
      </header>

      <div className="relative container mx-auto px-4 md:px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-3">
            Sistema Operacional Completo
          </p>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Tudo o que o{" "}
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              ChefiApp
            </span>{" "}
            faz
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            130+ funcionalidades integradas num só sistema. Sem módulos extra,
            sem add-ons pagos, sem surpresas. Tudo incluído nos 79 €/mês.
          </p>

          {/* Stats strip */}
          <div className="flex flex-wrap justify-center gap-8 mt-8">
            {[
              { value: "130+", label: "Funcionalidades" },
              { value: "12", label: "Módulos integrados" },
              { value: "5+", label: "Superfícies (TPV, KDS, Staff...)" },
              { value: "4", label: "Idiomas nativos" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-amber-500">
                  {s.value}
                </div>
                <div className="text-xs text-white/40">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Groups Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURE_GROUPS.map((group) => {
            const Icon = group.icon;
            return (
              <div
                key={group.title}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-amber-500/20 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {group.title}
                    </h2>
                    <p className="text-xs text-white/40">{group.description}</p>
                  </div>
                </div>
                <ul className="space-y-1.5 mt-4">
                  {group.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-white/70"
                    >
                      <Check className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">
            Tudo isto por{" "}
            <span className="text-amber-500">79 €/mês</span>
          </h3>
          <p className="text-white/50 text-sm mb-6">
            Sem módulos extra. Sem taxas por transacção. Sem surpresas.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/compare"
              className="px-6 py-3 text-sm font-medium rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-colors"
            >
              Comparar com o mercado
            </Link>
            <Link
              to="/pricing"
              className="px-6 py-3 text-sm font-medium rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-colors"
            >
              Ver preços
            </Link>
            <Link
              to="/auth/email"
              className="px-6 py-3 text-sm font-semibold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-colors inline-flex items-center gap-2"
            >
              Começar 14 dias grátis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-xs text-white/20">
          © 2024-{new Date().getFullYear()} ChefiApp™ OS · goldmonkey.studio
        </div>
      </div>
    </div>
  );
}

// Named export alias for backward compatibility
export { FeaturesPage };
