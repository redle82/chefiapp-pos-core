import type { LeakDefinition } from '../leak-map/LeakMapTypes';

// ------------------------------------------------------------------
// 💧 LEAK REGISTRY (THE MAP OF WASTE)
// ------------------------------------------------------------------
// "Reduzimos desperdício invisível antes de reduzir custo visível."
// ------------------------------------------------------------------

export const LEAK_REGISTRY: LeakDefinition[] = [
    // 1. PRODUÇÃO & QUALIDADE
    {
        id: 'leak-refire',
        category: 'production_quality',
        name: 'Prato Refeito (Refire)',
        symptoms: ['Prato volta para cozinha', 'Cliente reclama de ponto/sal'],
        root_causes: ['Falta de ficha técnica', 'Pressão excessiva', 'Treinamento fraco'],
        signals: ['kds_void_count', 'waiter_feedback_log'],
        daily_ritual: 'Checar "Refire Bin" no fim do turno',
        weekly_audit: 'Treinamento de ponto de carne',
        owner_role: 'kitchen',
        severity: 'high',
        estimated_monthly_impact_cents: 50000 // 500.00 eur
    },

    // 3. ESTOQUE & DESPERDÍCIO
    {
        id: 'leak-overproduction',
        category: 'production_quality', // Or inventory? User put in Production.
        name: 'Overproduction (Produzir demais)',
        symptoms: ['Sobra limpa no fim do turno', 'Lixo orgânico pesado'],
        root_causes: ['Medo de faltar', 'Par level inexistente'],
        signals: ['waste_log_weight', 'opening_stock_vs_par'],
        daily_ritual: 'Pesar lixo orgânico',
        owner_role: 'kitchen',
        severity: 'medium',
        estimated_monthly_impact_cents: 30000
    },
    {
        id: 'leak-expiry-silent',
        category: 'inventory_waste',
        name: 'Vencimento Silencioso',
        symptoms: ['Produto vencido na prateleira', 'Descarte de urgência'],
        root_causes: ['FIFO ignorado', 'Compra excessiva', 'Má rotação'],
        signals: ['expiry_alerts_count', 'inventory_value_stagnant'],
        daily_ritual: 'Ronda de validades (10 itens aleatórios)',
        owner_role: 'kitchen',
        severity: 'critical',
        estimated_monthly_impact_cents: 80000
    },

    // 4. PORCIONAMENTO & PRECIFICAÇÃO
    {
        id: 'leak-heavy-hand',
        category: 'portioning_pricing',
        name: 'Mão Pesada (Over-portioning)',
        symptoms: ['CMV alto', 'Cliente não aguenta comer tudo', 'Faltam porções no fim do dia'],
        root_causes: ['Falta de balança', 'Utensílio errado', 'Olhômetro'],
        signals: ['theoretical_vs_real_stock'],
        weekly_audit: 'Auditoria de pesagem cega',
        owner_role: 'kitchen',
        severity: 'high',
        estimated_monthly_impact_cents: 60000
    },

    // 5. CAIXA & FRAUDE
    {
        id: 'leak-ghost-revenue',
        category: 'cash_fraud',
        name: 'Receita Fantasma (Parece Pago)',
        symptoms: ['Caixa não bate', 'Mesa aberta esquecida'],
        root_causes: ['Erro de operação', 'Má fé', 'Sistema sem trava'],
        signals: ['open_tables_eod', 'voided_payments'],
        daily_ritual: 'Conferência de mesas abertas',
        owner_role: 'manager',
        severity: 'critical',
        estimated_monthly_impact_cents: 40000
    },

    // 8. ENERGIA & MANUTENÇÃO
    {
        id: 'leak-energy-usage',
        category: 'energy_maintenance',
        name: 'Equipamento Ligado à Toa',
        symptoms: ['Conta de luz alta', 'Forno ligado sem comida'],
        root_causes: ['Falta de ritual de ligar/desligar', 'Desatenção'],
        signals: ['energy_bill_trend'],
        daily_ritual: 'Checklist de desligamento',
        owner_role: 'maintenance',
        severity: 'medium',
        estimated_monthly_impact_cents: 20000
    },

    // 7. PESSOAS & OPERAÇÃO (Zombie Tasks)
    {
        id: 'leak-zombie-task',
        category: 'people_ops',
        name: 'Zombie Tasks (Inércia Operacional)',
        symptoms: ['Staff ocupado sem produzir valor', 'Tarefas inúteis sendo feitas'],
        root_causes: ['Mudança de processo não comunicada', 'Hábito'],
        signals: ['task_completion_time', 'operational_drift_reports'],
        weekly_audit: 'Revisão de Checklist com Staff',
        owner_role: 'manager',
        severity: 'medium',
        estimated_monthly_impact_cents: 25000 // 250.00
    },

    // 2. COMPRAS & FORNECEDORES
    {
        id: 'leak-panic-buying',
        category: 'purchasing_suppliers',
        name: 'Compras por Ansiedade',
        symptoms: ['Estoque abarrotado', 'Fluxo de caixa negativo'],
        root_causes: ['Sem par level confiável', 'Medo de faltar'],
        signals: ['inventory_turnover_rate', 'emergency_purchase_count'],
        weekly_audit: 'Revisão de Pedidos x Consumo',
        owner_role: 'manager',
        severity: 'high',
        estimated_monthly_impact_cents: 45000
    },

    // 6. DELIVERY & CANAIS
    {
        id: 'leak-platform-comm',
        category: 'delivery_channels',
        name: 'Margem Comida por Comissão',
        symptoms: ['Venda alta, lucro baixo', 'Custos de embalagem ignorados'],
        root_causes: ['Preço igual salão x delivery', 'Falta de engenharia de menu'],
        signals: ['delivery_margin_percent', 'packaging_cost_ratio'],
        weekly_audit: 'Análise de Margem por Canal',
        owner_role: 'owner',
        severity: 'high',
        estimated_monthly_impact_cents: 70000
    },

    // 9. HOTEL EXTAS
    {
        id: 'leak-no-show',
        category: 'hotel_extras',
        name: 'No-Show & Overbooking',
        symptoms: ['Mesa vazia reservada', 'Quarto vazio', 'Receita perdida'],
        root_causes: ['Sem política de garantia', 'Medo de cobrar'],
        signals: ['no_show_rate', 'revpar_gap'],
        daily_ritual: 'Confirmação de Reservas (SMS/Whatsapp)',
        owner_role: 'manager',
        severity: 'medium',
        estimated_monthly_impact_cents: 30000
    },

    // 10. GESTÃO SILENCIOSA
    {
        id: 'leak-blind-flight',
        category: 'management_silent',
        name: 'Voo Cego (Falta de Números)',
        symptoms: ['Surpresa no fim do mês', 'Decisões por "feeling"'],
        root_causes: ['Preguiça de medir', 'Falta de ferramenta'],
        signals: ['days_without_reports'],
        daily_ritual: 'Flash Report (5min)',
        owner_role: 'owner',
        severity: 'critical',
        estimated_monthly_impact_cents: 100000 // The cost of ignorance
    }
];
