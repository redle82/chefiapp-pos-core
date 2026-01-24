import { useVoiceCommands } from '../../../core/voice/useVoiceCommands';
import type { VoiceCommand } from '../../../core/voice/VoiceCommandService';
import { useToast } from '../../../ui/design-system';
import tpvEventBus, { createEvent } from '../../../core/tpv/TPVCentralEvents';

interface TPVVoiceControlProps {
    tables: any[];
    orders: any[];
    onSelectTable: (tableId: string) => void;
    onSwitchView: (view: any) => void;
    onCloseCash: () => void;
    onOpenPayment: () => void;
}

export const useTPVVoiceControl = ({
    tables,
    orders,
    onSelectTable,
    onSwitchView,
    onCloseCash,
    onOpenPayment
}: TPVVoiceControlProps) => {
    const { success } = useToast();

    // Helper to find table by number (voice usually gives number)
    const findTableId = (numberStr: string) => {
        const num = parseInt(numberStr);
        if (isNaN(num)) return null;
        const table = tables.find(t => t.number === num);
        return table ? table.id : null;
    };

    const commands: VoiceCommand[] = [
        // 1. SELECT TABLE ("Mesa 5", "Table 10")
        {
            pattern: /(mesa|table)\s+(\d+)/i,
            description: 'Selecionar Mesa',
            action: (match) => {
                if (match && match[2]) {
                    const tableNum = match[2];
                    const tableId = findTableId(tableNum);
                    if (tableId) {
                        onSelectTable(tableId);
                        speak(`Selecionando mesa ${tableNum}`);
                    } else {
                        speak(`Mesa ${tableNum} não encontrada`);
                    }
                }
            }
        },
        // 2. SWITCH VIEWS
        {
            pattern: /(ver|abrir|ir para)\s+(cozinha|kds|pedidos)/i,
            description: 'Ver Pedidos',
            action: () => {
                onSwitchView('orders');
                speak('Abrindo Pedidos');
            }
        },
        {
            pattern: /(ver|abrir|ir para)\s+(mapa|mesas)/i,
            description: 'Ver Mapa',
            action: () => {
                onSwitchView('tables');
                speak('Abrindo Mapa');
            }
        },
        // 3. ACTIONS
        {
            pattern: /(fechar|encerrar)\s+(caixa|dia)/i,
            description: 'Fechar Caixa',
            action: () => {
                onCloseCash();
                speak('Iniciando fechamento de caixa');
            }
        },
        // =========================================
        // PHASE 3: SITUATIONAL AWARENESS COMMANDS
        // =========================================
        // 4. ESTADO DA COZINHA
        {
            pattern: /estado\s+(da\s+)?cozinha/i,
            description: 'Estado da Cozinha',
            action: () => {
                const preparing = orders.filter((o: any) => o.status === 'preparing' || o.status === 'new').length;
                const delayed = orders.filter((o: any) => {
                    if (!o.createdAt) return false;
                    return (Date.now() - new Date(o.createdAt).getTime()) > 15 * 60 * 1000;
                }).length;

                let pressure = 'tranquila';
                if (preparing > 10) pressure = 'alta';
                else if (preparing > 5) pressure = 'média';

                const response = delayed > 0
                    ? `Cozinha com pressão ${pressure}. ${preparing} pedidos ativos, ${delayed} atrasados.`
                    : `Cozinha ${pressure}. ${preparing} pedidos ativos.`;
                speak(response);
            }
        },
        // 5. PEDIDOS PRESOS / ATRASADOS
        {
            pattern: /pedidos?\s+(presos?|atrasados?|bloqueados?)/i,
            description: 'Pedidos Atrasados',
            action: () => {
                const delayed = orders.filter((o: any) => {
                    if (!o.createdAt || o.status === 'delivered' || o.status === 'canceled') return false;
                    return (Date.now() - new Date(o.createdAt).getTime()) > 15 * 60 * 1000;
                });

                if (delayed.length === 0) {
                    speak('Sem pedidos atrasados. Tudo em dia.');
                } else {
                    const tableNumbers = delayed
                        .filter((o: any) => o.tableNumber)
                        .map((o: any) => o.tableNumber)
                        .slice(0, 3);
                    const response = tableNumbers.length > 0
                        ? `${delayed.length} pedidos atrasados. Mesas ${tableNumbers.join(', ')}.`
                        : `${delayed.length} pedidos atrasados.`;
                    speak(response);
                }
            }
        },
        // 6. IR PARA SITUAÇÃO (War Map)
        {
            pattern: /(ver|abrir|ir para)\s+(situação|painel|war\s*map|mapa\s+de\s+guerra)/i,
            description: 'Ver Situação',
            action: () => {
                onSwitchView('warmap');
                speak('Abrindo Painel de Situação');
            }
        },
        // 7. MESA ATRASADA? (Query specific table)
        {
            pattern: /mesa\s+(\d+)\s+(atrasada|status|como\s+est[aá])/i,
            description: 'Status da Mesa',
            action: (match) => {
                if (match && match[1]) {
                    const tableNum = parseInt(match[1]);
                    const table = tables.find((t: any) => t.number === tableNum);
                    const order = orders.find((o: any) => o.tableNumber === tableNum && o.status !== 'delivered' && o.status !== 'canceled');

                    if (!table) {
                        speak(`Mesa ${tableNum} não encontrada.`);
                    } else if (!order) {
                        speak(`Mesa ${tableNum} está livre.`);
                    } else {
                        const minutes = order.createdAt
                            ? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
                            : 0;
                        const isDelayed = minutes > 15;
                        const response = isDelayed
                            ? `Mesa ${tableNum} atrasada há ${minutes} minutos.`
                            : `Mesa ${tableNum} há ${minutes} minutos. Tudo normal.`;
                        speak(response);
                    }
                }
            }
        },
        // 8. QUANTAS MESAS
        {
            pattern: /quantas\s+mesas\s+(ocupadas?|livres?|total)/i,
            description: 'Contagem de Mesas',
            action: (match) => {
                const query = match?.[1]?.toLowerCase() || 'ocupadas';
                const occupied = tables.filter((t: any) => t.status === 'occupied').length;
                const free = tables.filter((t: any) => t.status === 'free').length;

                if (query.includes('livre')) {
                    speak(`${free} mesas livres.`);
                } else if (query.includes('total')) {
                    speak(`${tables.length} mesas no total. ${occupied} ocupadas, ${free} livres.`);
                } else {
                    speak(`${occupied} mesas ocupadas.`);
                }
            }
        },
        // 9. RESOLVER EXCEÇÃO
        {
            pattern: /(resolver|limpar|aceitar)\s+(exceção|problema|alerta)\s+mesa\s+(\d+)/i,
            description: 'Resolver Exceção',
            action: (match) => {
                if (match && match[3]) {
                    const tableNum = parseInt(match[3]);
                    tpvEventBus.emit(createEvent('ui.voice_command', {
                        command: 'resolve_exception',
                        tableNumber: tableNum
                    }, 'central'));
                    speak(`Resolvendo exceção mesa ${tableNum}`);
                }
            }
        }
    ];

    // Simple synthesis wrapper
    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-PT';
            window.speechSynthesis.speak(utterance);
        }
        // Also show toast
        success(`🎤 ${text}`);
    };

    // Need to handle the dynamic commands (Table X) manually since current Service is static.
    // Actually, I can use a more "raw" approach with the hook exposing 'transcript' 
    // but the current hook doesn't expose it.

    // DECISION: I will upgrade VoiceCommandService.ts to pass the 'match' object to the action.
    // This makes the most sense.

    const { isListening, startListening, stopListening, isAvailable } = useVoiceCommands(commands);

    return {
        isListening,
        startListening,
        stopListening,
        isAvailable
    };
};
