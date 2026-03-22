/**
 * Fonte única de verdade para os preços canónicos exibidos ao visitante.
 * 3 tiers: Essencial (49€), Profissional (99€), Enterprise (199€).
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

/* ─── Tier Definitions ─── */
export interface PricingTier {
  id: "essencial" | "profissional" | "enterprise";
  name: string;
  price: number;
  tagline: string;
  popular: boolean;
  features: string[];
  notIncluded: string[];
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "essencial",
    name: "Essencial",
    price: PRICE_ESSENCIAL,
    tagline: "Para quem está a começar",
    popular: false,
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
      "Centro de ajuda + email",
    ],
    notIncluded: [
      "Localizações ilimitadas",
      "Dashboard multi-unidade",
      "API aberta",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: PRICE_ENTERPRISE,
    tagline: "Para operações multi-unidade",
    popular: false,
    features: [
      "Tudo do Profissional +",
      "Localizações ilimitadas",
      "Dashboard multi-unidade centralizado",
      "API aberta para integrações",
      "White-label na página pública",
      "Exportação avançada de dados",
      "Centro de ajuda + email",
    ],
    notIncluded: [
      "Hardware físico",
      "Consultoria presencial",
      "Integrações custom sob medida",
    ],
  },
];
