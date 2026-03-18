/**
 * roleTaskTemplates.ts — Tarefas pré-definidas por role.
 *
 * Cada restaurante tem tarefas obrigatórias diárias por função.
 * Templates são dados estáticos; instâncias vivem em gm_tasks.
 * O campo `key` garante idempotência na criação.
 */

import type { StaffRole } from "../context/StaffCoreTypes";

// ---------------------------------------------------------------------------
// Template interface
// ---------------------------------------------------------------------------

export interface RoleTaskTemplate {
  /** Chave estável: "manager.open_shift" */
  key: string;
  /** Role que executa esta tarefa */
  role: StaffRole;
  /** Título (pt-PT) */
  title: string;
  /** Descrição curta */
  description?: string;
  /** Categoria operacional */
  category:
    | "opening"
    | "closing"
    | "cleaning"
    | "haccp"
    | "operational"
    | "maintenance"
    | "delivery"
    | "compliance";
  /** Prioridade */
  priority: "low" | "normal" | "high" | "critical";
  /** Tempo estimado em minutos */
  estimatedMinutes: number;
  /** Ícone (emoji) */
  icon: string;
  /** Tipo de evidência requerida */
  requiresEvidence?: "TEMP_LOG" | "TEXT" | "PHOTO";
  /** Ordem de exibição dentro do role */
  order: number;
  /** Momento do dia — ajuda a filtrar */
  moment?: "opening" | "during_service" | "closing" | "anytime";
  /** Obrigatória por lei (HACCP, etc.) */
  mandatory?: boolean;
}

// ---------------------------------------------------------------------------
// Manager — Gerente
// ---------------------------------------------------------------------------

const MANAGER_TASKS: RoleTaskTemplate[] = [
  {
    key: "manager.open_shift",
    role: "manager",
    title: "Abrir turno",
    description: "Validar equipa presente, equipamentos e stock inicial.",
    category: "opening",
    priority: "critical",
    estimatedMinutes: 10,
    icon: "🔑",
    order: 0,
    moment: "opening",
    mandatory: true,
  },
  {
    key: "manager.check_stock",
    role: "manager",
    title: "Verificar stock",
    description: "Confirmar níveis de ingredientes críticos e bebidas.",
    category: "opening",
    priority: "high",
    estimatedMinutes: 15,
    icon: "📦",
    order: 1,
    moment: "opening",
  },
  {
    key: "manager.validate_equipment",
    role: "manager",
    title: "Validar equipamentos",
    description: "Verificar funcionamento de fornos, câmaras e frigoríficos.",
    category: "maintenance",
    priority: "high",
    estimatedMinutes: 10,
    icon: "⚙️",
    order: 2,
    moment: "opening",
  },
  {
    key: "manager.confirm_schedule",
    role: "manager",
    title: "Confirmar escala de funcionários",
    description: "Verificar presenças e ajustar cobertura de turnos.",
    category: "operational",
    priority: "high",
    estimatedMinutes: 5,
    icon: "👥",
    order: 3,
    moment: "opening",
  },
  {
    key: "manager.review_pending_orders",
    role: "manager",
    title: "Revisar pedidos pendentes",
    description: "Verificar pedidos em atraso ou reservas do dia.",
    category: "operational",
    priority: "normal",
    estimatedMinutes: 10,
    icon: "📋",
    order: 4,
    moment: "during_service",
  },
  {
    key: "manager.daily_sales_report",
    role: "manager",
    title: "Relatório de vendas do dia",
    description: "Gerar e analisar relatório de fecho do dia.",
    category: "closing",
    priority: "high",
    estimatedMinutes: 15,
    icon: "📊",
    order: 5,
    moment: "closing",
  },
  {
    key: "manager.close_shift",
    role: "manager",
    title: "Fechar turno",
    description: "Confirmar fecho de caixa, verificar limpeza e desligar equipamentos.",
    category: "closing",
    priority: "critical",
    estimatedMinutes: 15,
    icon: "🔒",
    order: 6,
    moment: "closing",
    mandatory: true,
  },
];

// ---------------------------------------------------------------------------
// Waiter — Garçom
// ---------------------------------------------------------------------------

const WAITER_TASKS: RoleTaskTemplate[] = [
  {
    key: "waiter.mise_en_place",
    role: "waiter",
    title: "Mise en place das mesas",
    description: "Preparar todas as mesas com talheres, guardanapos e copos.",
    category: "opening",
    priority: "high",
    estimatedMinutes: 20,
    icon: "🍽️",
    order: 0,
    moment: "opening",
  },
  {
    key: "waiter.check_table_cleanliness",
    role: "waiter",
    title: "Verificar limpeza das mesas",
    description: "Inspecionar todas as mesas e cadeiras antes do serviço.",
    category: "cleaning",
    priority: "high",
    estimatedMinutes: 10,
    icon: "✨",
    order: 1,
    moment: "opening",
  },
  {
    key: "waiter.restock_cutlery",
    role: "waiter",
    title: "Repor talheres e guardanapos",
    description: "Garantir stock suficiente no aparador de serviço.",
    category: "operational",
    priority: "normal",
    estimatedMinutes: 10,
    icon: "🍴",
    order: 2,
    moment: "opening",
  },
  {
    key: "waiter.check_menus",
    role: "waiter",
    title: "Verificar cardápios",
    description: "Confirmar que todos os cardápios estão limpos e actualizados.",
    category: "operational",
    priority: "normal",
    estimatedMinutes: 5,
    icon: "📖",
    order: 3,
    moment: "opening",
  },
  {
    key: "waiter.close_tables",
    role: "waiter",
    title: "Fechar mesas ao final do serviço",
    description: "Limpar e preparar mesas para o próximo turno.",
    category: "closing",
    priority: "high",
    estimatedMinutes: 15,
    icon: "🧹",
    order: 4,
    moment: "closing",
  },
];

// ---------------------------------------------------------------------------
// Kitchen — Cozinha
// ---------------------------------------------------------------------------

const KITCHEN_TASKS: RoleTaskTemplate[] = [
  {
    key: "kitchen.check_temperatures",
    role: "kitchen",
    title: "Verificar temperaturas (HACCP)",
    description: "Registar temperaturas de câmaras, frigoríficos e congeladores.",
    category: "haccp",
    priority: "critical",
    estimatedMinutes: 10,
    icon: "🌡️",
    requiresEvidence: "TEMP_LOG",
    order: 0,
    moment: "opening",
    mandatory: true,
  },
  {
    key: "kitchen.mise_en_place",
    role: "kitchen",
    title: "Preparar mise en place",
    description: "Cortar, porcionar e preparar ingredientes para o serviço.",
    category: "opening",
    priority: "high",
    estimatedMinutes: 30,
    icon: "🔪",
    order: 1,
    moment: "opening",
  },
  {
    key: "kitchen.check_ingredients",
    role: "kitchen",
    title: "Verificar stock de ingredientes",
    description: "Confirmar ingredientes disponíveis e reportar faltas.",
    category: "operational",
    priority: "high",
    estimatedMinutes: 10,
    icon: "📦",
    order: 2,
    moment: "opening",
  },
  {
    key: "kitchen.clean_surfaces",
    role: "kitchen",
    title: "Limpar e desinfetar bancadas",
    description: "Higienizar todas as superfícies de trabalho (HACCP).",
    category: "haccp",
    priority: "critical",
    estimatedMinutes: 15,
    icon: "🧴",
    requiresEvidence: "PHOTO",
    order: 3,
    moment: "opening",
    mandatory: true,
  },
  {
    key: "kitchen.organize_cold_storage",
    role: "kitchen",
    title: "Organizar câmaras frigoríficas",
    description: "Verificar etiquetas, datas de validade e organização FIFO.",
    category: "haccp",
    priority: "high",
    estimatedMinutes: 15,
    icon: "❄️",
    order: 4,
    moment: "opening",
  },
  {
    key: "kitchen.close_cleaning",
    role: "kitchen",
    title: "Limpeza de fecho de cozinha",
    description: "Limpar equipamentos, bancadas e chão da cozinha.",
    category: "closing",
    priority: "high",
    estimatedMinutes: 30,
    icon: "🧹",
    order: 5,
    moment: "closing",
  },
];

// ---------------------------------------------------------------------------
// Cleaning — Limpeza
// ---------------------------------------------------------------------------

const CLEANING_TASKS: RoleTaskTemplate[] = [
  {
    key: "cleaning.bathrooms",
    role: "cleaning",
    title: "Limpar casas de banho",
    description: "Limpeza completa e reposição de consumíveis.",
    category: "cleaning",
    priority: "high",
    estimatedMinutes: 20,
    icon: "🚻",
    requiresEvidence: "PHOTO",
    order: 0,
    moment: "opening",
  },
  {
    key: "cleaning.dining_floor",
    role: "cleaning",
    title: "Limpar chão da sala",
    description: "Varrer e lavar o chão da área de refeições.",
    category: "cleaning",
    priority: "high",
    estimatedMinutes: 20,
    icon: "🧹",
    order: 1,
    moment: "opening",
  },
  {
    key: "cleaning.windows",
    role: "cleaning",
    title: "Limpar vidros e espelhos",
    description: "Limpar portas de vidro, janelas e espelhos.",
    category: "cleaning",
    priority: "normal",
    estimatedMinutes: 15,
    icon: "🪟",
    order: 2,
    moment: "opening",
  },
  {
    key: "cleaning.trash",
    role: "cleaning",
    title: "Verificar e esvaziar lixo",
    description: "Esvaziar todos os caixotes de lixo e separar recicláveis.",
    category: "cleaning",
    priority: "high",
    estimatedMinutes: 10,
    icon: "🗑️",
    order: 3,
    moment: "anytime",
  },
  {
    key: "cleaning.sanitize_surfaces",
    role: "cleaning",
    title: "Higienizar superfícies de contacto",
    description: "Desinfetar maçanetas, interruptores e superfícies tocadas.",
    category: "haccp",
    priority: "high",
    estimatedMinutes: 15,
    icon: "🧴",
    requiresEvidence: "TEXT",
    order: 4,
    moment: "during_service",
    mandatory: true,
  },
  {
    key: "cleaning.close_final",
    role: "cleaning",
    title: "Limpeza final do dia",
    description: "Inspecção final de todas as áreas antes de fechar.",
    category: "closing",
    priority: "high",
    estimatedMinutes: 20,
    icon: "✅",
    order: 5,
    moment: "closing",
  },
];

// ---------------------------------------------------------------------------
// Delivery — Entrega
// ---------------------------------------------------------------------------

const DELIVERY_TASKS: RoleTaskTemplate[] = [
  {
    key: "delivery.check_vehicle",
    role: "delivery",
    title: "Verificar veículo",
    description: "Inspecionar pneus, luzes, combustível e estado geral.",
    category: "opening",
    priority: "high",
    estimatedMinutes: 10,
    icon: "🛵",
    order: 0,
    moment: "opening",
  },
  {
    key: "delivery.check_thermal_bags",
    role: "delivery",
    title: "Verificar sacos térmicos",
    description: "Confirmar limpeza e integridade dos sacos de entrega.",
    category: "operational",
    priority: "high",
    estimatedMinutes: 5,
    icon: "🎒",
    order: 1,
    moment: "opening",
  },
  {
    key: "delivery.confirm_routes",
    role: "delivery",
    title: "Confirmar rotas do dia",
    description: "Verificar pedidos agendados e planear rotas eficientes.",
    category: "operational",
    priority: "normal",
    estimatedMinutes: 10,
    icon: "🗺️",
    order: 2,
    moment: "opening",
  },
  {
    key: "delivery.report_deliveries",
    role: "delivery",
    title: "Reportar entregas concluídas",
    description: "Registar todas as entregas do turno com tempos e feedback.",
    category: "closing",
    priority: "high",
    estimatedMinutes: 10,
    icon: "📝",
    order: 3,
    moment: "closing",
  },
];

// ---------------------------------------------------------------------------
// Worker — Staff genérico (tarefas atribuídas pelo gerente)
// ---------------------------------------------------------------------------

const WORKER_TASKS: RoleTaskTemplate[] = [
  {
    key: "worker.check_assigned",
    role: "worker",
    title: "Verificar tarefas atribuídas",
    description: "Consultar novas tarefas atribuídas pelo gerente.",
    category: "operational",
    priority: "normal",
    estimatedMinutes: 5,
    icon: "📋",
    order: 0,
    moment: "opening",
  },
  {
    key: "worker.support_service",
    role: "worker",
    title: "Apoio ao serviço",
    description: "Auxiliar onde necessário durante o serviço.",
    category: "operational",
    priority: "normal",
    estimatedMinutes: 0,
    icon: "🤝",
    order: 1,
    moment: "during_service",
  },
];

// ---------------------------------------------------------------------------
// Owner — Dono (verificações executivas, não tarefas operacionais)
// ---------------------------------------------------------------------------

const OWNER_TASKS: RoleTaskTemplate[] = [
  {
    key: "owner.review_dashboard",
    role: "owner",
    title: "Consultar dashboard operacional",
    description: "Verificar métricas do dia, vendas e alertas.",
    category: "operational",
    priority: "normal",
    estimatedMinutes: 5,
    icon: "📊",
    order: 0,
    moment: "anytime",
  },
  {
    key: "owner.review_critical_alerts",
    role: "owner",
    title: "Verificar alertas críticos",
    description: "Analisar e responder a alertas de equipamentos, HACCP ou operação.",
    category: "compliance",
    priority: "critical",
    estimatedMinutes: 10,
    icon: "🚨",
    order: 1,
    moment: "anytime",
  },
  {
    key: "owner.review_team_report",
    role: "owner",
    title: "Relatório de equipa",
    description: "Verificar presença, produtividade e feedback da equipa.",
    category: "operational",
    priority: "normal",
    estimatedMinutes: 10,
    icon: "👥",
    order: 2,
    moment: "closing",
  },
];

// ---------------------------------------------------------------------------
// Exportação — registo centralizado
// ---------------------------------------------------------------------------

export const ROLE_TASK_TEMPLATES: Record<StaffRole, RoleTaskTemplate[]> = {
  manager: MANAGER_TASKS,
  waiter: WAITER_TASKS,
  kitchen: KITCHEN_TASKS,
  cleaning: CLEANING_TASKS,
  delivery: DELIVERY_TASKS,
  worker: WORKER_TASKS,
  owner: OWNER_TASKS,
};

/** Obtém templates para um role específico */
export function getTemplatesForRole(role: StaffRole): RoleTaskTemplate[] {
  return ROLE_TASK_TEMPLATES[role] ?? [];
}

/** Todos os templates (todos os roles) */
export function getAllTemplates(): RoleTaskTemplate[] {
  return Object.values(ROLE_TASK_TEMPLATES).flat();
}

/** Filtra templates por momento do dia */
export function getTemplatesByMoment(
  role: StaffRole,
  moment: RoleTaskTemplate["moment"],
): RoleTaskTemplate[] {
  return getTemplatesForRole(role).filter(
    (t) => t.moment === moment || t.moment === "anytime",
  );
}

/** Conta totais por role */
export function getTemplateCountByRole(): Record<StaffRole, number> {
  return Object.fromEntries(
    Object.entries(ROLE_TASK_TEMPLATES).map(([role, templates]) => [
      role,
      templates.length,
    ]),
  ) as Record<StaffRole, number>;
}
