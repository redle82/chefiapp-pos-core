/**
 * Fonte única de verdade para os preços canónicos exibidos ao visitante.
 * 4 tiers: Essencial (49€), Profissional (99€), Enterprise (199€), Custom (sob consulta).
 */

/* ─── Tier Prices ─── */
export const PRICE_ESSENCIAL = 49;
export const PRICE_PROFISSIONAL = 99;
export const PRICE_ENTERPRISE = 199;

/* ─── Backward-compatible (aponta para o tier mais popular) ─── */
export const CANONICAL_MONTHLY_PRICE_EUR = PRICE_PROFISSIONAL;
export const CANONICAL_MONTHLY_PRICE_LABEL = `${PRICE_PROFISSIONAL} €/mês`;
export const CANONICAL_MONTHLY_PRICE_OVERLAY = `A partir de ${PRICE_ESSENCIAL} €/mês após 14 dias grátis`;

/** Returns price label with currency symbol. */
export function getCanonicalMonthlyPriceLabel(): string {
  try {
    const { getCurrencySymbol } = require("@/core/currency/CurrencyService");
    return `${PRICE_PROFISSIONAL} ${getCurrencySymbol()}/mês`;
  } catch {
    return `${PRICE_PROFISSIONAL} €/mês`;
  }
}

/* ─── Enterprise Limits ─── */
export const ENTERPRISE_LIMITS = {
  locations: 10,
  staff: 200,
  devices: 20,
} as const;

/* ─── Tier Definitions ─── */
export interface PricingTier {
  id: "essencial" | "profissional" | "enterprise" | "custom";
  name: string;
  price: number | null; // null = sob consulta
  tagline: string;
  popular: boolean;
  features: string[];
  notIncluded: string[];
  limits?: {
    locations?: number | string;
    staff?: number | string;
    devices?: number | string;
  };
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "essencial",
    name: "Essencial",
    price: PRICE_ESSENCIAL,
    tagline: "Para quem está a começar",
    popular: false,
    limits: {
      locations: 1,
      staff: "Ilimitado",
      devices: 3,
    },
    features: [
      "TPV completo (mesa + balcão + takeaway)",
      "1 ecrã KDS",
      "Dashboard básico do dono",
      "Gestão de cardápio e categorias",
      "Fecho de caixa auditável",
      "Multi-método de pagamento",
      "Funciona offline (PWA)",
      "1 idioma",
      "1 localização",
      "Até 3 dispositivos",
      "Centro de ajuda + email",
      "Actualizações contínuas",
    ],
    notIncluded: [
      "AppStaff",
      "Reservas integradas",
      "Inventário avançado",
      "Pedidos online / QR",
      "Gamificação e Loyalty",
      "Alertas com runbooks",
      "Multi-idioma",
      "Ecrãs extra (bar, expo, delivery)",
    ],
  },
  {
    id: "profissional",
    name: "Profissional",
    price: PRICE_PROFISSIONAL,
    tagline: "Para restaurantes que querem controlo total",
    popular: true,
    limits: {
      locations: 2,
      staff: "Ilimitado",
      devices: 10,
    },
    features: [
      "Tudo do Essencial +",
      "KDS ilimitados (cozinha, bar, expo)",
      "AppStaff completo (6 dashboards)",
      "Reservas integradas",
      "Pedidos online e QR",
      "Inventário avançado (receitas, waste tracking)",
      "Alertas operacionais com runbooks",
      "Relatórios avançados + export CSV",
      "Multi-idioma (PT/EN/ES/FR)",
      "Compliance fiscal PT/ES",
      "Gamificação staff (XP, badges)",
      "Loyalty / pontos de fidelidade",
      "Ecrã de cliente",
      "Até 2 localizações",
      "Até 10 dispositivos",
      "Centro de ajuda + email",
    ],
    notIncluded: [
      "Mais de 2 localizações",
      "Dashboard multi-unidade",
      "API aberta",
      "White-label",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: PRICE_ENTERPRISE,
    tagline: "Para operações de maior escala",
    popular: false,
    limits: {
      locations: ENTERPRISE_LIMITS.locations,
      staff: ENTERPRISE_LIMITS.staff,
      devices: ENTERPRISE_LIMITS.devices,
    },
    features: [
      "Tudo do Profissional +",
      "Até 10 localizações",
      "Até 200 funcionários",
      "Até 20 dispositivos operacionais",
      "Dashboard multi-unidade centralizado",
      "API aberta para integrações",
      "White-label na página pública",
      "Permissões avançadas por localização",
      "Exportação avançada de dados",
      "Centro de ajuda + email",
    ],
    notIncluded: [
      "Mais de 10 localizações",
      "Operações multi-brand",
      "Integrações custom sob medida",
      "Onboarding assistido dedicado",
    ],
  },
  {
    id: "custom",
    name: "Custom",
    price: null,
    tagline: "Para grupos e operações complexas",
    popular: false,
    limits: {
      locations: "Sem limite",
      staff: "Sem limite",
      devices: "Sem limite",
    },
    features: [
      "Tudo do Enterprise +",
      "Localizações sem limite",
      "Operações multi-brand",
      "Integrações custom sob medida",
      "Onboarding assistido dedicado",
      "Arquitectura e pricing sob consulta",
    ],
    notIncluded: [],
  },
];
