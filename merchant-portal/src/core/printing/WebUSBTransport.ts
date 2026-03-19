/**
 * WebUSB Transport — Comunicação com impressoras térmicas via WebUSB API.
 *
 * Requisitos do browser:
 * - Chromium ≥ 61 (Chrome, Edge, Opera)
 * - Contexto seguro (HTTPS ou localhost)
 * - NÃO suportado em Firefox ou Safari
 *
 * A API WebUSB exige que o utilizador seleccione o dispositivo manualmente
 * (gesto do utilizador obrigatório na primeira ligação).
 */

import { KNOWN_PRINTER_VENDORS, PrinterError } from './types';

/** Configuração de interface e endpoint detectados automaticamente */
interface DeviceEndpoint {
  interfaceNumber: number;
  endpointNumber: number;
}

/**
 * Verifica se o browser suporta a API WebUSB.
 */
export function isWebUSBSupported(): boolean {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

/**
 * Transporte WebUSB para impressoras térmicas ESC/POS.
 *
 * Fluxo de utilização:
 * 1. requestDevice() — O utilizador selecciona a impressora
 * 2. connect() — Abre a ligação USB
 * 3. send() — Envia dados ESC/POS
 * 4. disconnect() — Fecha a ligação
 */
export class WebUSBTransport {
  private device: USBDevice | null = null;
  private endpoint: DeviceEndpoint | null = null;

  /**
   * Abre o diálogo do browser para o utilizador seleccionar uma impressora USB.
   *
   * Filtra por vendor IDs conhecidos de fabricantes de impressoras térmicas
   * (Epson, Star, Citizen, Bixolon, Sewoo).
   *
   * @throws {PrinterError} Se WebUSB não for suportado ou permissão negada.
   */
  async requestDevice(): Promise<USBDevice> {
    if (!isWebUSBSupported()) {
      throw new PrinterError(
        'WebUSB não é suportado neste browser. Use Chrome, Edge ou Opera.',
        'USB_NOT_SUPPORTED',
      );
    }

    const vendorFilters = Object.values(KNOWN_PRINTER_VENDORS).map((vendorId) => ({
      vendorId,
    }));

    try {
      const device = await navigator.usb.requestDevice({
        filters: vendorFilters,
      });
      this.device = device;
      return device;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotFoundError') {
        throw new PrinterError(
          'Nenhuma impressora seleccionada pelo utilizador.',
          'DEVICE_NOT_FOUND',
        );
      }
      throw new PrinterError(
        'Permissão para aceder à impressora USB foi negada.',
        'PERMISSION_DENIED',
      );
    }
  }

  /**
   * Liga-se ao dispositivo USB previamente seleccionado.
   *
   * Abre o dispositivo, selecciona a configuração, reivindica a interface
   * e detecta o endpoint de saída (bulk OUT).
   *
   * @param device - Dispositivo USB (obtido via requestDevice)
   * @throws {PrinterError} Se não for possível abrir o dispositivo ou encontrar endpoint.
   */
  async connect(device: USBDevice): Promise<void> {
    this.device = device;

    try {
      await this.device.open();

      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
      }

      // Encontrar a interface e endpoint de saída (bulk OUT)
      const endpoint = this.findBulkOutEndpoint();
      if (!endpoint) {
        throw new PrinterError(
          'Não foi possível encontrar um endpoint de saída na impressora.',
          'DEVICE_NOT_FOUND',
        );
      }

      this.endpoint = endpoint;
      await this.device.claimInterface(endpoint.interfaceNumber);
    } catch (err) {
      if (err instanceof PrinterError) throw err;
      throw new PrinterError(
        `Erro ao ligar à impressora: ${err instanceof Error ? err.message : String(err)}`,
        'SEND_FAILED',
      );
    }
  }

  /**
   * Envia dados binários (ESC/POS) para a impressora.
   *
   * Os dados são enviados em blocos de 64 bytes para evitar problemas
   * de buffer em impressoras mais lentas.
   *
   * @param data - Uint8Array com comandos ESC/POS
   * @throws {PrinterError} Se a impressora não estiver ligada.
   */
  async send(data: Uint8Array): Promise<void> {
    if (!this.device || !this.endpoint) {
      throw new PrinterError(
        'Impressora não está ligada. Chame connect() primeiro.',
        'NOT_CONNECTED',
      );
    }

    const CHUNK_SIZE = 64;
    try {
      for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
        const chunk = data.slice(offset, Math.min(offset + CHUNK_SIZE, data.length));
        await this.device.transferOut(this.endpoint.endpointNumber, chunk);
      }
    } catch (err) {
      throw new PrinterError(
        `Erro ao enviar dados para a impressora: ${err instanceof Error ? err.message : String(err)}`,
        'SEND_FAILED',
      );
    }
  }

  /**
   * Desliga da impressora e liberta a interface USB.
   */
  async disconnect(): Promise<void> {
    if (!this.device) return;

    try {
      if (this.endpoint) {
        await this.device.releaseInterface(this.endpoint.interfaceNumber);
      }
      await this.device.close();
    } catch {
      // Ignorar erros de desligação — o dispositivo pode já estar desligado
    } finally {
      this.device = null;
      this.endpoint = null;
    }
  }

  /**
   * Verifica se a impressora está ligada.
   */
  isConnected(): boolean {
    return this.device !== null && this.device.opened === true;
  }

  /**
   * Devolve o nome do dispositivo ligado, ou null se não houver ligação.
   */
  getDeviceName(): string | null {
    if (!this.device) return null;
    return this.device.productName || `USB ${this.device.vendorId.toString(16)}`;
  }

  /**
   * Devolve o dispositivo USB actual (para inspecção).
   */
  getDevice(): USBDevice | null {
    return this.device;
  }

  // -----------------------------------------------------------------------
  // Internos
  // -----------------------------------------------------------------------

  /**
   * Procura o primeiro endpoint bulk OUT na configuração actual do dispositivo.
   * Prioriza interfaces com classe de impressora (7) mas aceita qualquer interface
   * com endpoint bulk OUT.
   */
  private findBulkOutEndpoint(): DeviceEndpoint | null {
    if (!this.device?.configuration) return null;

    for (const iface of this.device.configuration.interfaces) {
      for (const alt of iface.alternates) {
        for (const ep of alt.endpoints) {
          if (ep.direction === 'out' && ep.type === 'bulk') {
            return {
              interfaceNumber: iface.interfaceNumber,
              endpointNumber: ep.endpointNumber,
            };
          }
        }
      }
    }

    return null;
  }
}
