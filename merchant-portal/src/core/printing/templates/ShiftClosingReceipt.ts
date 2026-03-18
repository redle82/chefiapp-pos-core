/**
 * Template de Recibo de Fecho de Turno — ESC/POS.
 *
 * Imprime o relatório de fecho de caixa com:
 * - Nome do restaurante
 * - Período do turno (abertura → fecho)
 * - Nome do operador
 * - Total de pedidos
 * - Receita por método de pagamento
 * - Dinheiro em caixa
 * - Esperado vs. real (com diferença)
 */

import { EscPosBuilder } from '../EscPosDriver';
import type { ShiftClosingData } from '../types';

/**
 * Formata cêntimos em string de preço (ex: 1250 → "12.50").
 */
function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Formata data/hora no formato DD/MM/AAAA HH:MM.
 */
function formatDateTime(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

/**
 * Calcula a duração formatada entre duas datas.
 */
function formatDuration(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}min`;
}

/**
 * Gera um recibo de fecho de turno em ESC/POS.
 *
 * @param data - Dados do fecho de turno
 */
export function buildShiftClosingReceipt(data: ShiftClosingData): EscPosBuilder {
  const b = new EscPosBuilder();
  const now = new Date();
  const difference = data.actualBalance - data.expectedBalance;
  const totalRevenue = Object.values(data.revenueByMethod).reduce((sum, v) => sum + v, 0);

  b.init();

  // ---- Cabeçalho ----
  b.align('center');
  b.size(2, 2);
  b.bold(true);
  b.text(data.restaurantName.toUpperCase());
  b.size(1, 1);
  b.emptyLine();
  b.text('FECHO DE TURNO');
  b.bold(false);

  b.separator('=');

  // ---- Dados do turno ----
  b.align('left');
  b.columns2('Operador:', data.operatorName);

  if (data.terminalId) {
    b.columns2('Terminal:', data.terminalId);
  }

  b.emptyLine();
  b.columns2('Abertura:', formatDateTime(data.openedAt));
  b.columns2('Fecho:', formatDateTime(data.closedAt));
  b.columns2('Duracao:', formatDuration(data.openedAt, data.closedAt));

  b.separator('-');

  // ---- Resumo operacional ----
  b.bold(true);
  b.text('RESUMO OPERACIONAL');
  b.bold(false);
  b.emptyLine();

  b.columns2('Total pedidos:', String(data.totalOrders));
  b.columns2('Receita total:', `${formatPrice(totalRevenue)}`);

  b.separator('-');

  // ---- Receita por método de pagamento ----
  b.bold(true);
  b.text('RECEITA POR METODO');
  b.bold(false);
  b.emptyLine();

  const sortedMethods = Object.entries(data.revenueByMethod).sort(
    ([, a], [, b]) => b - a,
  );

  for (const [method, amount] of sortedMethods) {
    b.columns2(`  ${method}:`, formatPrice(amount));
  }

  b.separator('=');

  // ---- Caixa ----
  b.bold(true);
  b.text('CAIXA');
  b.bold(false);
  b.emptyLine();

  b.columns2('Dinheiro em caixa:', formatPrice(data.cashInDrawer));
  b.columns2('Saldo esperado:', formatPrice(data.expectedBalance));
  b.columns2('Saldo real:', formatPrice(data.actualBalance));

  b.separator('-');

  // ---- Diferença (destaque) ----
  b.bold(true);
  b.size(2, 1);

  const diffStr = difference >= 0
    ? `+${formatPrice(difference)}`
    : formatPrice(difference);

  b.columns2('DIFERENCA:', diffStr);
  b.size(1, 1);
  b.bold(false);

  if (Math.abs(difference) > 0) {
    b.emptyLine();
    b.align('center');
    if (difference > 0) {
      b.text('(Excedente)');
    } else {
      b.bold(true);
      b.text('** DEFICIT **');
      b.bold(false);
    }
  }

  b.separator('=');

  // ---- Rodapé ----
  b.align('center');
  b.emptyLine();
  b.text('Documento interno');
  b.text(`Emitido: ${formatDateTime(now)}`);
  b.emptyLine();
  b.text('______________________________');
  b.text('Assinatura do operador');

  b.feed(2);
  b.cut();

  return b;
}
