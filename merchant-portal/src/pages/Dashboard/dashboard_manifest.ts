
export type SovereignStatus = 'active' | 'planned' | 'locked' | 'experimental';

export interface SovereignModule {
    id: string;
    label: string;
    description: string;
    status: SovereignStatus;
    icon?: string;
    path?: string; // If active
    dependencies?: string[];
    phase?: string;
}

export interface SovereignSection {
    id: string;
    title: string;
    modules: SovereignModule[];
}

export const SOVEREIGN_MANIFEST: SovereignSection[] = [
    {
        id: 'system_state',
        title: 'Estado do Sistema',
        modules: [
            { id: 'sys_health', label: 'Saúde & Conexões', description: 'Monitoramento de integridade real-time', status: 'active', icon: '❤️' },
            { id: 'sys_db', label: 'Banco de Dados', description: 'Sincronização com Supabase', status: 'active', icon: '🗄️' },
            { id: 'sys_devices', label: 'Dispositivos Ativos', description: 'Hardware e terminais conectados', status: 'planned', icon: '📱', phase: 'Expansion', dependencies: ['Local Gateway'] },
            { id: 'sys_backups', label: 'Cápsulas de Backup', description: 'Snapshots de segurança', status: 'locked', icon: '💾', phase: 'Hardening' },
            { id: 'sys_logs', label: 'Caixa Preta', description: 'Registros de Auditoria S0', status: 'locked', icon: '📑', phase: 'Hardening' }
        ]
    },
    {
        id: 'operation',
        title: 'Operação (Front-Line)',
        modules: [
            { id: 'op_tpv', label: 'TPV / Caixa', description: 'Terminal de Vendas Soberano', status: 'active', path: '/app/tpv', icon: '🖥️' },
            { id: 'op_kds', label: 'KDS / Cozinha', description: 'Orquestração de Fluxo Nervoso', status: 'active', path: '/app/kds', icon: '👨‍🍳' },
            { id: 'op_menu', label: 'Cardápio', description: 'Gestão de Produtos e Preços', status: 'active', path: '/app/menu', icon: '🍔' },
            { id: 'op_orders', label: 'Pedidos', description: 'Histórico e Gestão de Pedidos', status: 'active', path: '/app/orders', icon: '📃' },
            { id: 'op_routing', label: 'Roteamento Inteligente', description: 'Distribuição automática de carga', status: 'experimental', icon: '🛣️', phase: 'Intelligence' },
            { id: 'op_sla', label: 'SLA de Serviço', description: 'Metas de Tempo e Qualidade', status: 'planned', icon: '⏱️', phase: 'Governance' },
            { id: 'op_shifts', label: 'Gestão de Turnos', description: 'Escalas e Check-ins', status: 'locked', icon: '⏳', phase: 'Sovereign Core' },
            { id: 'op_checklists', label: 'Checklists Dinâmicos', description: 'Protocolos de abertura e fecho', status: 'planned', icon: '📋', phase: 'Sovereign Core' },
            { id: 'op_map', label: 'Sala & Mesas', description: 'Gestão de Mesas e Zonas', status: 'active', path: '/app/dashboard', icon: '🗺️' },
            { id: 'op_peak', label: 'Modo Pico', description: 'Proteção contra sobrecarga', status: 'experimental', icon: '⚡', phase: 'High Performance' }
        ]
    },
    {
        id: 'governance',
        title: 'Governança (The Guard)',
        modules: [
            { id: 'gov_haccp', label: 'Registros HACCP', description: 'Segurança Alimentar Digital', status: 'locked', icon: '🧼', phase: 'Compliance' },
            { id: 'gov_incidents', label: 'Central de Incidentes', description: 'Relatório de anomalias', status: 'planned', icon: '🚨', phase: 'Hardening' },
            { id: 'gov_training', label: 'Treinamentos Invisíveis', description: 'Educação via Interface', status: 'experimental', icon: '🎓', phase: 'Intelligence' },
            { id: 'gov_roles', label: 'Permissões & Papéis', description: 'Controle de Acesso Soberano', status: 'active', icon: '🔐' }
        ]
    },
    {
        id: 'public_presence',
        title: 'Presença Pública (Ecosystem)',
        modules: [
            { id: 'pub_landing', label: 'Página Pública', description: 'Presença Digital Gerada', status: 'active', icon: '🌐' },
            { id: 'pub_branding', label: 'Branding Kit', description: 'Ativos e Identidade', status: 'locked', icon: '🎨', phase: 'Expansion' },
            { id: 'pub_seo', label: 'Motor de SEO', description: 'Visibilidade Local Automática', status: 'planned', icon: '🔍', phase: 'Expansion' },
            { id: 'pub_reputation', label: 'Reputação Central', description: 'Reviews e Feedback', status: 'locked', icon: '⭐', phase: 'Expansion' },
            { id: 'pub_events', label: 'Gestão de Eventos', description: 'Reservas e Datas', status: 'planned', icon: '📅', phase: 'Expansion' },
            { id: 'pub_tracking', label: 'Tracking Etico', description: 'Análise de Tráfego', status: 'experimental', icon: '📈', phase: 'Intelligence' }
        ]
    },
    {
        id: 'integrations',
        title: 'Integrações (Neural Links)',
        modules: [
            { id: 'int_whatsapp', label: 'WhatsApp Concierge', description: 'Comunicação Directa', status: 'locked', icon: '💬', phase: 'Neural Connect' },
            { id: 'int_comms', label: 'Email / SMS Relay', description: 'Notificações de Sistema', status: 'planned', icon: '📧', phase: 'Neural Connect' },
            { id: 'int_webhooks', label: 'Webhooks / API', description: 'Interconexão Externa', status: 'experimental', icon: '🔌', phase: 'Neural Connect' },
            { id: 'int_hardware', label: 'Hardware Local', description: 'Impressoras e Dispositivos', status: 'locked', icon: '🖨️', phase: 'Neural Connect' },
            { id: 'int_acc', label: 'Contabilidade & SAF-T', description: 'Exportação Fiscal', status: 'planned', icon: '🏛️', phase: 'Compliance' }
        ]
    },
    {
        id: 'intelligence',
        title: 'Inteligência (Cognitive)',
        modules: [
            { id: 'ai_anomalies', label: 'Detector de Anomalias', description: 'Identificação de fricção', status: 'experimental', icon: '🧠', phase: 'Intelligence' },
            { id: 'ai_sug', label: 'Sugestões do Dia', description: 'Dicas Operacionais Ad-hoc', status: 'planned', icon: '💡', phase: 'Intelligence' },
            { id: 'ai_score', label: 'Score de Operação', description: 'Ranking de Eficiência', status: 'experimental', icon: '🏆', phase: 'Intelligence' }
        ]
    },
    {
        id: 'finances',
        title: 'Finanças & Métricas',
        modules: [
            { id: 'fin_sales', label: 'Vendas do Dia', description: 'Diário / Semanal / Mensal', status: 'active', icon: '💰' },
            { id: 'fin_cmv', label: 'CMV Dinâmico', description: 'Custo de Mercadoria Vendida', status: 'locked', icon: '📊', phase: 'Finance' },
            { id: 'fin_margin', label: 'Margem de Contribuição', description: 'Lucratividade Real', status: 'planned', icon: '📈', phase: 'Finance' },
            { id: 'fin_top', label: 'Top Performance', description: 'Produtos Estrela', status: 'locked', icon: '🌟', phase: 'Finance' },
            { id: 'fin_cash', label: 'Fecho de Caixa', description: 'Conciliação e Sangria', status: 'active', icon: '💵' }
        ]
    }
    // Meta-produto (Roadmap, Status MVP) moved to Evolve Hub - see MENU_CONTRACT.md
];
