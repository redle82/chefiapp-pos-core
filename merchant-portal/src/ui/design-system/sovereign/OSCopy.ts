/**
 * OSCopy.ts
 * 
 * The Single Source of Truth for all operational text in ChefIApp.
 * This file enforces the "Sovereign" tone: direct, calm, secure, and industrial.
 * 
 * Rules:
 * 1. No "Oops", "Sorry", or "Success!".
 * 2. Use specific operational terms (e.g., "Command", "Shift", "Protocol").
 * 3. Empty states must explain the *operational void*, not just "no data".
 */

export const OSCopy = {
    auth: {
        loginTitle: 'Entrar no Sistema',
        loginSubtitle: 'Sem senhas. Sem complicação.',
        loginJustBorn: 'Conta criada. Entre para ativar.',
        googleButton: 'Entrar com Google',
        privacyNote: 'Usamos apenas seu email para criar sua conta. Nada é publicado.',
        technicalAccess: 'Acesso Técnico (Legado)',
        restrictedArea: 'Acesso restrito ao ecossistema Soberano.'
    },
    landing: {
        heroTitle: 'Sistema',
        heroSubtitle: 'para Restaurantes',
        heroDescription: 'Execução em tempo real. Cozinha, salão e caixa no mesmo fluxo.',
        ctaPrimary: 'Começar agora',
        ctaSecondary: 'Acesso existente',
        badge: 'CHEFIAPP™ OS',
        problemTitle: '🔥 Se você vive isto todos os dias...',
        problemSubtitle: 'Você não precisa de mais um app. Você precisa de disciplina operacional.',
        cycleTitle: 'Um ciclo completo, sem intermediários.',
        audienceTitle: 'Para quem é',
        audienceSubtitle: 'Feito para quem leva a operação a sério.'
    },
    dashboard: {
        title: 'Comando Central',
        subtitle: 'Visão Geral da Operação',
        operation: 'Operação Agora',
        priority: 'PRIORIDADE IMEDIATA'
    },
    navigation: {
        dashboard: 'Comando Central',
        settings: 'Ajustes do Núcleo',
        tpv: 'TPV (Caixa)',
        kds: 'KDS (Cozinha)',
        menu: 'Cardápio',
        team: 'Equipa',
        reports: 'Analisar',
        logout: 'Encerrar Turno'
    },
    actions: {
        save: 'Gravar Alterações',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        confirm: 'Confirmar Procedimento',
        loading: 'Processando...'
    },
    emptyStates: {
        generic: {
            title: 'Vazio Operacional',
            description: 'Nenhuma atividade registrada neste setor até o momento.'
        },
        orders: {
            title: 'Sem Ordens Ativas',
            description: 'O sistema aguarda entrada de novos pedidos via TPV ou Canais.'
        },
        team: {
            title: 'Equipa não Alocada',
            description: 'Nenhum operador registado no turno atual.'
        }
    },
    errors: {
        generic: 'Interrupção de Serviço',
        network: 'Conexão Instável. Verifique o link.',
        permission: 'Acesso Negado pelo Protocolo.',
        actionFailed: 'Erro ao executar ação.'
    },
    research: {
        hubTitle: 'RESEARCH HUB',
        hubSubtitle: 'Cognitive TPV',
        accessAction: 'Acessar Sistema',
        footer: 'ChefIApp Research • Cognitive TPV'
    },
    modules: {
        notFoundTitle: 'Módulo Não Identificado',
        notFoundDesc: 'O caminho que seguiu não está mapeado no manifesto soberano.',
        phaseLabel: 'Fase Atual',
        dependenciesLabel: 'Dependências Críticas',
        observationActive: 'Protocolo de Observação Ativo',
        observationDesc: 'Este módulo está no radar de desenvolvimento. Dados exploratórios já estão sendo coletados para calibração.',
        backToCommand: '← Voltar ao Comando Central'
    },
    operations: {
        hubTitle: 'OperationalHub',
        hubSubtitle: 'Gestão completa de operações — Fast Mode, Stock, Fichaje, Delivery, Analytics',
        createTask: 'Criar Tarefa',
        analytics: {
            title: 'Hoje',
            sales: 'Vendas',
            orders: 'Pedidos',
            avgTicket: 'Ticket Médio'
        },
        fastMode: {
            title: 'Fast Mode',
            active: 'Ativo',
            inactive: 'Inativo',
            description: 'Modo de venda ultrarrápida para Fast Service.',
            notConfigured: 'Status: Offline / Não Configurado.'
        },
        stock: {
            title: 'Estoque Baixo',
            allGood: 'Níveis de estoque normais. Nenhuma ação requerida.'
        },
        shifts: {
            title: 'Turnos Ativos',
            none: 'Turno Operacional Inativo.'
        },
        delivery: {
            title: 'Delivery',
            none: 'Canais de Delivery Inativos.'
        },
        tasks: {
            title: 'Tarefas',
            none: 'Fila de tarefas limpa. Nenhuma prioridade pendente.',
            status: {
                pending: 'Pendentes',
                focused: 'Em foco',
                done: 'Concluídas',
                all: 'Todas'
            },
            priority: {
                critical: 'Crítica',
                urgent: 'Urgente',
                attention: 'Atenção',
                background: 'Background',
                all: 'Todas prioridades'
            }
        }
    },
    governance: {
        title: 'GovernManage',
        subtitle: 'Inteligência de reviews e gestão de reputação.',
        runPipeline: 'Executar Pipeline',
        processing: 'Processando...',
        pipelineExecuted: 'Pipeline executado com sucesso!',
        pipelineFailed: 'Falha na execução do pipeline.',
        sections: {
            runningActions: 'Ações em execução',
            rating: 'Avaliação Média',
            alerts: 'Alertas',
            churn: 'Principais Motivos de Insatisfação',
            recommended: 'Ações Recomendadas',
            noPending: 'Governança em dia. Nenhuma recomendação pendente.'
        },
        topics: {
            price: 'Preço',
            cleanliness: 'Limpeza',
            service: 'Atendimento',
            food: 'Comida',
            ambience: 'Ambiente',
            wait_time: 'Tempo de Espera',
            value: 'Custo-benefício'
        }
    },
    menu: {
        title: 'Gestão do Menu',
        subtitle: 'Organize categorias, produtos e preços.',
        emptyTitle: 'Menu Não Configurado',
        emptyDesc: 'Nenhum produto cadastrado no Kernel. Inicie a configuração.',
        draftBanner: 'Visibilidade Restrita (Rascunho). Ative para publicação pública.',
        modeDraft: 'MODO RASCUNHO',
        actions: {
            activate: 'Ativar Restaurante',
            autoCreator: 'Iniciar Automação',
            startZero: 'Começar do Zero',
            addCategory: '+ Categoria',
            addProduct: '+ Produto',
            edit: '✏️ Editar',
            lock: '🔒 Travar Edição',
            save: 'Salvar',
            cancel: 'Cancelar',
            add: 'Adicionar'
        },
        labels: {
            catName: 'NOME DA CATEGORIA',
            prodName: 'NOME DO PRODUTO',
            price: 'PREÇO (€)',
            category: 'CATEGORIA',
            catPlaceholder: 'Ex: Bebidas...',
            prodPlaceholder: 'Ex: Burger...',
            pricePlaceholder: '0.00'
        },
        feedback: {
            catCreated: 'Categoria criada.',
            prodCreated: 'Produto registado.',
            prodUpdated: 'Produto atualizado.',
            prodDeleted: 'Produto eliminado.',
            selectCat: 'Seleção de categoria obrigatória.',
            errorLoad: 'Falha na leitura do Kernel de Menu.',
            errorCreateCat: 'Falha ao persistir categoria.',
            errorSaveProd: 'Falha ao persistir dados no Kernel.',
            errorDeleteProd: 'Operação rejeitada pelo sistema.'
        },
        airlock: {
            viewMenu: 'Consultar Cardápio',
            viewMenuDesc: 'Acesso público ao inventário disponível.',
            staffArea: 'Acesso Restrito',
            staffAreaDesc: 'Área exclusiva para Operadores autorizados.',
            info: 'Informações',
            infoDesc: 'Dados de contato e localização.'
        }
    }
} as const;
