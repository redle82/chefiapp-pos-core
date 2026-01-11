/**
 * Mensagens de erro em PT-PT para o onboarding
 * Transforma códigos de erro técnicos em copy amigável
 */

export interface ErrorMessage {
  title: string;
  message: string;
  action?: string;
}

export const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // Auth errors
  TOKEN_INVALID_OR_EXPIRED: {
    title: 'Link expirado',
    message: 'Este link já não é válido. Pede um novo.',
    action: 'Pedir novo link',
  },
  TOKEN_REQUIRED: {
    title: 'Link inválido',
    message: 'Falta o código de acesso. Usa o link que recebeste no email.',
  },
  UNAUTHORIZED: {
    title: 'Sem autorização',
    message: 'Não tens permissão para aceder aqui.',
    action: 'Voltar ao início',
  },

  // Slug errors
  SLUG_TAKEN: {
    title: 'Nome já existe',
    message: 'Esse nome já está a ser usado por outro restaurante. Tenta outro.',
    action: 'Escolher outro nome',
  },
  SLUG_INVALID_FORMAT: {
    title: 'Nome inválido',
    message: 'Usa apenas letras, números e hífens (sem espaços ou acentos).',
    action: 'Corrigir nome',
  },
  SLUG_INVALID_LENGTH: {
    title: 'Nome muito curto ou longo',
    message: 'O nome deve ter entre 3 e 63 caracteres.',
    action: 'Ajustar nome',
  },
  SLUG_RESERVED: {
    title: 'Nome reservado',
    message: 'Este nome está reservado pelo sistema. Escolhe outro.',
    action: 'Escolher outro nome',
  },

  // Backend errors
  RESTAURANT_ID_REQUIRED: {
    title: 'Sessão perdida',
    message: 'Parece que perdeste a ligação. Recomeça o processo.',
    action: 'Recomeçar',
  },
  NOT_FOUND: {
    title: 'Não encontrado',
    message: 'O restaurante que procuras não existe.',
    action: 'Voltar',
  },
  INTERNAL_ERROR: {
    title: 'Algo correu mal',
    message: 'Erro do sistema. Tenta novamente em alguns segundos.',
    action: 'Tentar novamente',
  },

  // Feature gate errors
  FEATURE_BLOCKED: {
    title: 'Funcionalidade bloqueada',
    message: 'Esta funcionalidade não está disponível no teu plano.',
    action: 'Ver planos',
  },
  WEB_LEVEL_BLOCKED: {
    title: 'Nível web insuficiente',
    message: 'Precisas de upgrade para aceder a esta funcionalidade.',
    action: 'Ver upgrade',
  },

  // Menu errors
  MENU_INCOMPLETE: {
    title: 'Menu incompleto',
    message: 'Adiciona pelo menos 1 categoria e 1 item ao menu.',
    action: 'Adicionar itens',
  },

  // Payment errors
  PAYMENTS_INCOMPLETE: {
    title: 'Pagamentos não configurados',
    message: 'Liga os teus pagamentos antes de publicar.',
    action: 'Configurar pagamentos',
  },

  // Network errors
  NETWORK_ERROR: {
    title: 'Sem ligação',
    message: 'Verifica a tua internet e tenta novamente.',
    action: 'Tentar novamente',
  },
  TIMEOUT: {
    title: 'Pedido demorou muito',
    message: 'O servidor está lento. Tenta novamente.',
    action: 'Tentar novamente',
  },

  // Generic fallback
  UNKNOWN_ERROR: {
    title: 'Erro desconhecido',
    message: 'Algo inesperado aconteceu. Contacta o suporte se persistir.',
    action: 'Contactar suporte',
  },
};

/**
 * Get user-friendly error message from error code or object
 */
export function getErrorMessage(error: any): ErrorMessage {
  // If error is a string code
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // If error is an object with error property
  if (error && typeof error === 'object') {
    const code = error.error || error.code || error.message;
    if (typeof code === 'string') {
      return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }

  // Fallback
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Display error in UI (returns formatted JSX-ready object)
 */
export function formatErrorForDisplay(error: any): { title: string; message: string; action?: string } {
  const errorMsg = getErrorMessage(error);
  return {
    title: errorMsg.title,
    message: errorMsg.message,
    action: errorMsg.action,
  };
}

/**
 * Check if error is retryable (network, timeout, server errors)
 */
export function isRetryableError(error: any): boolean {
  const code = typeof error === 'string' ? error : error?.error || error?.code;
  const retryable = ['NETWORK_ERROR', 'TIMEOUT', 'INTERNAL_ERROR', 'UNKNOWN_ERROR'];
  return retryable.includes(code);
}

/**
 * Check if error is a user fixable error (slug taken, invalid format, etc)
 */
export function isUserFixableError(error: any): boolean {
  const code = typeof error === 'string' ? error : error?.error || error?.code;
  const fixable = ['SLUG_TAKEN', 'SLUG_INVALID_FORMAT', 'SLUG_INVALID_LENGTH', 'MENU_INCOMPLETE', 'PAYMENTS_INCOMPLETE'];
  return fixable.includes(code);
}
