/**
 * ErrorMessages - Centralized Error Message Helper
 *
 * Provides specific, actionable error messages for common scenarios.
 * Replaces generic "Erro ao..." messages with context-aware messages.
 */

export interface ErrorContext {
  code?: string;
  message?: string;
  tableId?: string;
  tableNumber?: number;
  orderId?: string;
  itemName?: string;
  restaurantId?: string;
  [key: string]: any;
}

/**
 * Get user-friendly error message based on error code/context
 */
export function getErrorMessage(error: any, context?: ErrorContext): string {
  const code = error?.code || context?.code;
  const message = error?.message || context?.message || "";

  // Order-related errors
  if (
    code === "CASH_REGISTER_CLOSED" ||
    message.includes("CASH_REGISTER_CLOSED")
  ) {
    return "Caixa não está aberto. Abra o caixa antes de criar vendas.";
  }

  if (
    code === "TABLE_HAS_ACTIVE_ORDER" ||
    message.includes("TABLE_HAS_ACTIVE_ORDER")
  ) {
    const tableInfo = context?.tableNumber
      ? `Mesa ${context.tableNumber}`
      : context?.tableId
      ? "Esta mesa"
      : "A mesa";
    return `${tableInfo} já possui um pedido ativo. Feche ou pague o pedido existente primeiro.`;
  }

  if (code === "EMPTY_ORDER" || message.includes("EMPTY_ORDER")) {
    return "Pedido deve ter pelo menos 1 item. Adicione itens do menu primeiro.";
  }

  if (
    code === "23505" &&
    (message.includes("idx_one_open_order_per_table") ||
      message.includes("duplicate key value violates unique constraint"))
  ) {
    const tableInfo = context?.tableNumber
      ? `Mesa ${context.tableNumber}`
      : context?.tableId
      ? "Esta mesa"
      : "A mesa";
    return `${tableInfo} já possui um pedido aberto. Feche ou pague o pedido existente antes de criar um novo.`;
  }

  // Payment errors
  if (
    code === "PAYMENT_FAILED" ||
    message.includes("payment") ||
    message.includes("pagamento")
  ) {
    if (message.includes("insufficient")) {
      return "Valor insuficiente. Verifique o valor recebido.";
    }
    if (message.includes("gateway") || message.includes("stripe")) {
      return "Erro no processamento do pagamento. Verifique a conexão e tente novamente.";
    }
    return "Erro ao processar pagamento. Verifique os dados e tente novamente.";
  }

  // Config / Backend — evitar vazar "Supabase forbidden" ou "Docker" ao utilizador
  if (
    message.includes("Supabase client forbidden") ||
    message.includes("forbidden in Docker")
  ) {
    return "Operação indisponível nesta configuração. Utilize a aplicação em modo normal.";
  }
  if (
    message.includes("dockerCoreClient") &&
    message.includes("not a function")
  ) {
    return "Erro ao comunicar com o servidor. Recarregue a página e tente novamente.";
  }

  // Network/Connection errors
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout")
  ) {
    return "Sem conexão com o servidor. Verifique sua internet e tente novamente.";
  }

  if (message.includes("offline") || message.includes("disconnected")) {
    return "Você está offline. Aguarde a reconexão ou tente novamente.";
  }

  // Database errors
  if (code === "23503" || message.includes("foreign key")) {
    return "Dados inválidos. Verifique se todos os itens estão corretos.";
  }

  if (code === "23505" || message.includes("duplicate key")) {
    return "Este item já existe. Verifique os dados e tente novamente.";
  }

  // Permission errors
  if (
    code === "42501" ||
    message.includes("permission") ||
    message.includes("unauthorized")
  ) {
    return "Você não tem permissão para realizar esta ação.";
  }

  // Item-specific errors
  if (context?.itemName) {
    if (message.includes("not found") || message.includes("não encontrado")) {
      return `${context.itemName} não foi encontrado no menu. Atualize o menu e tente novamente.`;
    }
    if (message.includes("unavailable") || message.includes("indisponível")) {
      return `${context.itemName} está indisponível no momento.`;
    }
  }

  // Table-specific errors
  if (context?.tableNumber) {
    if (message.includes("not found") || message.includes("não encontrado")) {
      return `Mesa ${context.tableNumber} não foi encontrada. Verifique a configuração de mesas.`;
    }
  }

  // Order-specific errors
  if (context?.orderId) {
    if (message.includes("not found") || message.includes("não encontrado")) {
      return "Pedido não encontrado. Ele pode ter sido cancelado ou já finalizado.";
    }
    if (message.includes("closed") || message.includes("fechado")) {
      return "Este pedido já foi fechado. Não é possível modificá-lo.";
    }
  }

  // Generic fallback - try to extract useful info from message
  if (message && message.length > 0) {
    // If message is already user-friendly, use it
    if (!message.includes("Error:") && !message.includes("Failed to")) {
      return message;
    }
    // Otherwise, provide generic but helpful message
    return "Ocorreu um erro. Tente novamente ou contate o suporte se o problema persistir.";
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
}

/**
 * Get actionable suggestion based on error
 */
export function getErrorSuggestion(
  error: any,
  context?: ErrorContext,
): string | null {
  const code = error?.code || context?.code;
  const message = error?.message || context?.message || "";

  if (code === "CASH_REGISTER_CLOSED") {
    return 'Clique em "Abrir Caixa" no menu superior.';
  }

  if (code === "TABLE_HAS_ACTIVE_ORDER") {
    return "Abra o pedido existente da mesa para adicionar itens.";
  }

  if (message.includes("network") || message.includes("offline")) {
    return "Verifique sua conexão com a internet.";
  }

  if (code === "EMPTY_ORDER") {
    return "Selecione itens do menu para adicionar ao pedido.";
  }

  return null;
}
