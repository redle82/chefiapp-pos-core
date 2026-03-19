/**
 * PrintService — Serviço central de impressão ESC/POS.
 *
 * Orquestra o WebUSBTransport e os templates para oferecer uma API simples
 * de impressão de recibos, tickets e operações de caixa.
 *
 * Uso:
 * ```ts
 * const service = new PrintService();
 * await service.connect();
 * await service.printOrderReceipt(order, restaurant, 'Dinheiro');
 * await service.openCashDrawer();
 * ```
 */

import { EscPosBuilder } from './EscPosDriver';
import { WebUSBTransport } from './WebUSBTransport';
import { buildOrderReceipt } from './templates/OrderReceipt';
import { buildKitchenTicket } from './templates/KitchenTicket';
import { buildShiftClosingReceipt } from './templates/ShiftClosingReceipt';
import type { RestaurantIdentity, ShiftClosingData, KitchenStation } from './types';
import { PrinterError } from './types';
import type { Order } from '@/domain/order/types';

/**
 * Serviço de impressão ESC/POS via WebUSB.
 */
export class PrintService {
  private transport: WebUSBTransport;

  constructor(transport?: WebUSBTransport) {
    this.transport = transport ?? new WebUSBTransport();
  }

  // -----------------------------------------------------------------------
  // Ligação
  // -----------------------------------------------------------------------

  /**
   * Abre o diálogo do browser para seleccionar e ligar a uma impressora USB.
   * Requer gesto do utilizador (click).
   */
  async connect(): Promise<void> {
    const device = await this.transport.requestDevice();
    await this.transport.connect(device);
  }

  /**
   * Liga-se a um dispositivo USB já conhecido (ex: reconexão automática).
   */
  async connectToDevice(device: USBDevice): Promise<void> {
    await this.transport.connect(device);
  }

  /**
   * Desliga da impressora.
   */
  async disconnect(): Promise<void> {
    await this.transport.disconnect();
  }

  /**
   * Verifica se a impressora está ligada e pronta.
   */
  isReady(): boolean {
    return this.transport.isConnected();
  }

  /**
   * Devolve o nome da impressora ligada.
   */
  getDeviceName(): string | null {
    return this.transport.getDeviceName();
  }

  // -----------------------------------------------------------------------
  // Impressão
  // -----------------------------------------------------------------------

  /**
   * Imprime o recibo do cliente.
   *
   * @param order - Pedido completo (domain/order/types.Order)
   * @param restaurant - Identidade do restaurante
   * @param paymentMethod - Método de pagamento (opcional)
   */
  async printOrderReceipt(
    order: Order,
    restaurant: RestaurantIdentity,
    paymentMethod?: string,
    options?: import('./templates/OrderReceipt').ReceiptPrintOptions,
  ): Promise<void> {
    this.assertConnected();

    try {
      const builder = buildOrderReceipt(order, restaurant, paymentMethod, options);
      await this.transport.send(builder.build());
    } catch (err) {
      if (err instanceof PrinterError) throw err;
      throw new PrinterError(
        `Erro ao imprimir recibo: ${err instanceof Error ? err.message : String(err)}`,
        'TEMPLATE_ERROR',
      );
    }
  }

  /**
   * Imprime um ticket para a cozinha ou bar.
   *
   * Filtra automaticamente os itens pela estação indicada.
   * Se nenhum item pertencer à estação, não imprime (silenciosamente).
   *
   * @param order - Pedido com itens (aceita o formato domain ou KitchenOrder)
   * @param station - Estação: 'KITCHEN' ou 'BAR'
   */
  async printKitchenTicket(
    order: Parameters<typeof buildKitchenTicket>[0],
    station: KitchenStation = 'KITCHEN',
  ): Promise<void> {
    this.assertConnected();

    try {
      const builder = buildKitchenTicket(order, station);
      if (!builder) {
        // Sem itens para esta estação — não imprimir
        return;
      }
      await this.transport.send(builder.build());
    } catch (err) {
      if (err instanceof PrinterError) throw err;
      throw new PrinterError(
        `Erro ao imprimir ticket de ${station.toLowerCase()}: ${err instanceof Error ? err.message : String(err)}`,
        'TEMPLATE_ERROR',
      );
    }
  }

  /**
   * Imprime o recibo de fecho de turno.
   *
   * @param shiftData - Dados do fecho de turno
   */
  async printShiftClosing(shiftData: ShiftClosingData): Promise<void> {
    this.assertConnected();

    try {
      const builder = buildShiftClosingReceipt(shiftData);
      await this.transport.send(builder.build());
    } catch (err) {
      if (err instanceof PrinterError) throw err;
      throw new PrinterError(
        `Erro ao imprimir fecho de turno: ${err instanceof Error ? err.message : String(err)}`,
        'TEMPLATE_ERROR',
      );
    }
  }

  /**
   * Abre a gaveta de dinheiro.
   *
   * @param pin - Conector da gaveta: 0 (padrão) ou 1
   */
  async openCashDrawer(pin: 0 | 1 = 0): Promise<void> {
    this.assertConnected();

    const builder = new EscPosBuilder();
    builder.init().openDrawer(pin);
    await this.transport.send(builder.build());
  }

  /**
   * Imprime um recibo de teste para verificar a ligação e formatação.
   *
   * Inclui exemplos de:
   * - Tamanhos de texto
   * - Alinhamentos
   * - Negrito e normal
   * - Separadores
   * - QR code
   * - Caracteres portugueses
   */
  async testPrint(): Promise<void> {
    this.assertConnected();

    const b = new EscPosBuilder();

    b.init();

    // Cabeçalho
    b.align('center');
    b.size(2, 2);
    b.bold(true);
    b.text('TESTE DE IMPRESSAO');
    b.size(1, 1);
    b.bold(false);
    b.text('ChefIApp POS');

    b.separator('=');

    // Caracteres portugueses
    b.align('left');
    b.bold(true);
    b.text('Caracteres PT:');
    b.bold(false);
    b.text('a e i o u - acentos');
    b.text('Acao, coracao, mae');
    b.text('Cafe, voce, ate');
    b.text('Euro: 12.50');

    b.separator('-');

    // Alinhamentos
    b.align('left');
    b.text('Esquerda');
    b.align('center');
    b.text('Centro');
    b.align('right');
    b.text('Direita');

    b.separator('-');

    // Tamanhos
    b.align('left');
    b.size(1, 1);
    b.text('Normal');
    b.size(2, 1);
    b.text('Duplo largo');
    b.size(1, 2);
    b.text('Duplo alto');
    b.size(2, 2);
    b.text('Duplo');
    b.size(1, 1);

    b.separator('-');

    // Colunas
    b.columns2('Subtotal:', '45.00');
    b.columns2('IVA 23%:', '10.35');
    b.bold(true);
    b.columns2('TOTAL:', '55.35');
    b.bold(false);

    b.separator('-');

    // QR Code
    b.align('center');
    b.text('QR Code:');
    b.qrCode('https://chefiapp.com/test', 4);

    b.separator('=');

    // Rodapé
    b.align('center');
    b.text('Teste concluido com sucesso!');

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    b.text(`${dd}/${mm}/${yyyy} ${hh}:${min}`);

    b.feed(2);
    b.cut();

    await this.transport.send(b.build());
  }

  // -----------------------------------------------------------------------
  // Internos
  // -----------------------------------------------------------------------

  /**
   * Garante que a impressora está ligada antes de enviar dados.
   */
  private assertConnected(): void {
    if (!this.transport.isConnected()) {
      throw new PrinterError(
        'Impressora nao esta ligada. Ligue a impressora primeiro.',
        'NOT_CONNECTED',
      );
    }
  }
}
