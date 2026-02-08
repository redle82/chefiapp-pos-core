/**
 * Mock para a página Assinatura / Billing Center.
 * Ref: Last.app Tu suscripción — depois conectar Stripe/SumUp/backend.
 */

import type {
  Plan,
  UsageMeter,
  BillingSummary,
  PaymentMethod,
  Invoice,
} from "../types";

export const MOCK_PLANS: Plan[] = [
  {
    id: "growth",
    name: "Growth",
    isCurrent: true,
    features: [
      "Software TPV (4 dispositivos)",
      "Integrador de delivery (até 550 pedidos)",
      "Marcas Virtuais Ilimitadas",
      "Integração com plataformas (até 6 integrações)",
      "Pedidos de delivery adicionais (0,04 €)",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    features: [
      "Software TPV (1 dispositivo)",
      "E-mail e SMS de confirmação",
      "Vistas do calendário de reservas no TPV",
      "Notificações de fecho",
      "Telemetria integrada no TPV",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    features: [
      "Software TPV (2 dispositivos)",
      "Integrador de delivery (até 200 pedidos)",
      "Reservas e turnos",
      "QR Ordering",
    ],
  },
];

export const MOCK_USAGE: UsageMeter[] = [
  {
    id: "pos-devices",
    label: "Dispositivos POS",
    hint: "Dispositivos = caixas com sessão ativa",
    used: 0,
    limit: 4,
    unit: "dispositivos",
    manageHref: "/admin/config/dispositivos",
    manageLabel: "Administrar dispositivos",
  },
  {
    id: "integrations",
    label: "Integrações",
    hint: "Integrações = canais conectados (Glovo, Uber, etc.)",
    used: 0,
    limit: 6,
    unit: "integrações",
    manageHref: "/admin/config/integraciones",
    manageLabel: "Administrar integrações",
  },
  {
    id: "delivery-orders",
    label: "Pedidos de delivery",
    hint: "Pedidos importados de plataformas no ciclo atual",
    used: 0,
    limit: 550,
    unit: "pedidos",
    extraCostPerUnit: 0.04,
    manageHref: "/admin/config/delivery",
    manageLabel: "Activar en submódulos",
  },
  {
    id: "sms",
    label: "SMS",
    hint: "SMS enviados (confirmações, recordatorios)",
    used: 0,
    limit: 0,
    unit: "SMS",
    extraCostPerUnit: 0.04,
    manageLabel: "Ver uso",
  },
];

export const MOCK_BILLING: BillingSummary = {
  cycle: "monthly",
  nextChargeAt: "2026-02-05",
  subtotalEur: 95.0,
  taxEur: 19.95,
  totalEur: 114.95,
  planLabel: "Growth Plan · Basic Plan Reservas",
  canSwitchToYearly: true,
};

export const MOCK_PAYMENT: PaymentMethod = {
  brand: "Visa",
  last4: "3024",
  expiryMonth: 12,
  expiryYear: 2027,
  failureDeadline: null,
};

export const MOCK_BILLING_EMAIL = "legal@my.es";

export const MOCK_INVOICES: Invoice[] = [];
// Exemplo com dados: [{ id: "inv-1", date: "2026-01-05", amountEur: 114.95, status: "paid" }];
