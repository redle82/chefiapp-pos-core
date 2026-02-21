/**
 * GuardMessages — Mensagens canónicas para guards operacionais (Fase 4).
 *
 * Centraliza textos de bloqueio (caixa, turno, sistema indisponível, permissões)
 * para garantir que "bloqueado" significa sempre a mesma coisa na UI.
 * Não altera quando bloqueiam, só COMO estão organizados.
 */

/** Caixa fechado: criar vendas / adicionar item. */
export const MSG_CASH_REGISTER_CLOSED_CREATE =
  "Caixa não está aberto. Abra o caixa antes de criar vendas.";

/** Caixa fechado: receber pagamentos. */
export const MSG_CASH_REGISTER_CLOSED_PAY =
  "Abra o caixa antes de receber pagamentos.";

/** Versão curta (atalhos / voz): abrir caixa para vender. */
export const MSG_OPEN_CASH_BEFORE_CREATE = "Abra o caixa antes de criar vendas";

/** Erro ao verificar estado do caixa (rede/backend). */
export const MSG_VERIFY_CASH_ERROR =
  "Erro ao verificar caixa. Abra o caixa antes de criar vendas.";

/** Caixa desconhecido em modo offline (caixa estava aberto antes de cair a rede). */
export const MSG_CASH_UNKNOWN_OFFLINE =
  "Caixa desconhecido (offline). Certifique-se que o caixa estava aberto antes de cair a rede.";

/** Caixa já está fechado (ação redundante, ex.: fechar caixa). */
export const MSG_CASH_ALREADY_CLOSED = "Caixa já está fechado";

/** Sistema indisponível: ações críticas bloqueadas (prepare, ready, cancel). */
export const MSG_SYSTEM_UNAVAILABLE_ACTION =
  "Sistema indisponível. Ação bloqueada. Tente em breve.";

/** Sistema indisponível: pagamentos bloqueados. */
export const MSG_SYSTEM_UNAVAILABLE_PAYMENT =
  "Sistema indisponível. Pagamentos bloqueados por segurança. Tente em breve.";

/** Apenas gerentes podem abrir o caixa. */
export const MSG_MANAGER_ONLY_OPEN_CASH =
  "Apenas gerentes podem abrir o caixa principal";

/** Apenas gerentes podem fechar o caixa. */
export const MSG_MANAGER_ONLY_CLOSE_CASH =
  "Apenas gerentes podem fechar o caixa";
