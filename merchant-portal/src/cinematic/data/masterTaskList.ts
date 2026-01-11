import type { TaskDef } from './taskLibrary';

export const MASTER_TASK_LIST: TaskDef[] = [
    // --- OPENING (ABERTURA) ---
    {
        id: 'open_lights',
        title: 'Ligar Iluminação e AC',
        description: 'Garantir ambiente confortável e verificar lâmpadas fundidas.',
        priority: 'high',
        type: 'opening',
        estimatedMinutes: 5,
        role: 'all'
    },
    {
        id: 'open_cash',
        title: 'Abertura de Caixa (Fundo de Maneio)',
        description: 'Contar fundo de caixa e registar no TPV.',
        priority: 'critical',
        type: 'opening',
        estimatedMinutes: 10,
        role: 'manager'
    },
    {
        id: 'open_coffee',
        title: 'Calibragem Máquina de Café',
        description: 'Tirar primeiros cafés de teste e verificar moagem.',
        priority: 'high',
        type: 'opening',
        estimatedMinutes: 10,
        businessTypes: ['cafe', 'restaurant', 'bakery'], // Removed 'burger', 'pizza'
        role: 'bar'
    },
    {
        id: 'open_terrace',
        title: 'Montar Esplanada',
        description: 'Limpar mesas e cadeiras, colocar cinzeiros.',
        priority: 'medium',
        type: 'opening',
        estimatedMinutes: 15,
        role: 'worker'
    },

    // --- PREP (PREPARAÇÃO) ---
    {
        id: 'prep_lemons',
        title: 'Cortar Limões e Rodelas',
        description: 'Preparar guarnições para bebidas (limão, laranja, hortelã).',
        priority: 'medium',
        type: 'prep',
        estimatedMinutes: 15,
        businessTypes: ['bar', 'restaurant', 'club'],
        role: 'bar'
    },
    {
        id: 'prep_sauces',
        title: 'Repor Molhos e Galheteiros',
        description: 'Encher azeite, vinagre, piri-piri e ketchup.',
        priority: 'medium',
        type: 'prep',
        estimatedMinutes: 20,
        businessTypes: ['restaurant'], // Cleaned types
        role: 'worker'
    },
    {
        id: 'prep_ice',
        title: 'Encher Máquina de Gelo / Baldes',
        description: 'Garantir stock de gelo para o turno.',
        priority: 'high',
        type: 'prep',
        estimatedMinutes: 5,
        role: 'bar'
    },

    // --- HACCP (HIGIENE) ---
    {
        id: 'haccp_fridge',
        title: 'Registo Temperaturas (Frio)',
        description: 'Verificar e anotar temperatura das arcas e frigoríficos.',
        priority: 'critical',
        type: 'compliance',
        estimatedMinutes: 5,
        requiresValidation: true,
        role: 'manager'
    },
    {
        id: 'haccp_labels',
        title: 'Verificar Validades',
        description: 'Garantir que todos os produtos abertos têm etiqueta com data.',
        priority: 'critical',
        type: 'compliance',
        estimatedMinutes: 10,
        role: 'kitchen'
    },
    {
        id: 'clean_wc',
        title: 'Verificar Limpeza WC',
        description: 'Papel, sabonete, limpeza geral. Preencher folha.',
        priority: 'high',
        type: 'cleaning',
        estimatedMinutes: 5,
        trigger: { event: 'shift_start' },
        role: 'worker'
    },

    // --- CLOSING (FECHO) ---
    {
        id: 'close_trash',
        title: 'Levar Lixo (Orgânico/Vidro)',
        description: 'Esvaziar todos os caixotes e colocar saco novo.',
        priority: 'high',
        type: 'cleaning',
        estimatedMinutes: 10,
        role: 'all'
    },
    {
        id: 'close_floor',
        title: 'Varrer e Lavar Chão',
        description: 'Usar detergente correto. Cuidado com piso molhado.',
        priority: 'medium',
        type: 'cleaning',
        estimatedMinutes: 20,
        role: 'worker'
    },
    {
        id: 'close_cash',
        title: 'Fecho de Caixa (Cego)',
        description: 'Contar dinheiro sem ver total do sistema. Entregar ao gerente.',
        priority: 'critical',
        type: 'closing',
        estimatedMinutes: 15,
        requiresValidation: true,
        role: 'manager'
    },
    {
        id: 'close_coffee',
        title: 'Limpeza Química Máquina Café',
        description: 'Executar ciclo de limpeza com pó químico.',
        priority: 'high',
        type: 'closing',
        estimatedMinutes: 10,
        businessTypes: ['cafe', 'restaurant', 'bakery'],
        role: 'bar'
    }
];
