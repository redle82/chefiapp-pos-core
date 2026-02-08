/**
 * Error Mapper - Traduz erros do Core para mensagens humanas
 *
 * Responsabilidades:
 * - Mapear códigos de erro para mensagens claras
 * - Incluir contexto (mesa, pedido, etc)
 * - Sugerir ação quando possível
 * - NUNCA esconder o erro
 */

export interface ErrorContext {
  tableId?: string;
  tableNumber?: number;
  orderId?: string;
  constraint?: string;
  [key: string]: any;
}

export interface MappedError {
  message: string;
  suggestion?: string;
  code?: string;
  context?: ErrorContext;
}

/**
 * Mapear erro do Core para mensagem humana clara
 */
export function mapCoreError(error: any, context?: ErrorContext): MappedError {
  const code = error?.code;
  const message = error?.message || '';

  // Constraint: uma mesa = um pedido aberto
  if (code === '23505' && (message.includes('idx_one_open_order_per_table') || message.includes('duplicate key'))) {
    const tableInfo = context?.tableNumber
      ? `Mesa ${context.tableNumber}`
      : context?.tableId
        ? 'Esta mesa'
        : 'A mesa';

    return {
      message: `${tableInfo} já possui um pedido aberto. Feche ou pague o pedido existente antes de criar um novo.`,
      suggestion: context?.orderId
        ? `Feche o pedido #${context.orderId.slice(0, 8)} ou escolha outra mesa.`
        : 'Escolha outra mesa ou feche o pedido existente.',
      code: '23505',
      context,
    };
  }

  // Caixa fechado
  if (code === 'CASH_REGISTER_CLOSED' || message.includes('CASH_REGISTER_CLOSED')) {
    return {
      message: 'Caixa não está aberto. Abra o caixa antes de criar vendas.',
      suggestion: 'Clique em "Abrir Caixa" no menu superior.',
      code: 'CASH_REGISTER_CLOSED',
      context,
    };
  }

  // Pedido vazio
  if (code === 'EMPTY_ORDER' || message.includes('EMPTY_ORDER')) {
    return {
      message: 'Pedido deve ter pelo menos 1 item. Adicione itens do menu primeiro.',
      suggestion: 'Selecione itens do menu para adicionar ao pedido.',
      code: 'EMPTY_ORDER',
      context,
    };
  }

  // Foreign key (dados inválidos)
  if (code === '23503' || message.includes('foreign key')) {
    return {
      message: 'Dados inválidos. Verifique se todos os itens estão corretos.',
      suggestion: 'Recarregue a página e tente novamente.',
      code: '23503',
      context,
    };
  }

  // Permission errors
  if (code === '42501' || message.includes('permission') || message.includes('unauthorized')) {
    return {
      message: 'Você não tem permissão para realizar esta ação.',
      suggestion: 'Entre em contato com o gerente.',
      code: '42501',
      context,
    };
  }

  // Network/Connection errors
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return {
      message: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
      suggestion: 'Verifique sua conexão com a internet.',
      code: 'NETWORK_ERROR',
      context,
    };
  }

  // Generic fallback
  return {
    message: message || 'Ocorreu um erro. Tente novamente ou contate o suporte se o problema persistir.',
    code: code || 'UNKNOWN',
    context,
  };
}
