/**
 * Template de Recibo do Cliente — ESC/POS.
 *
 * Imprime o recibo completo com:
 * - Cabeçalho do restaurante (nome + morada, centrado, tamanho duplo)
 * - Data/hora
 * - Número do pedido e mesa
 * - Itens com quantidade, nome, preço unitário e total da linha
 * - Modificadores indentados
 * - Subtotal, IVA, total (negrito, tamanho duplo)
 * - Método de pagamento
 * - Rodapé: "Obrigado pela preferência"
 * - QR code com ID do pedido
 */

import { EscPosBuilder } from '../EscPosDriver';
import type { RestaurantIdentity } from '../types';
import type { Order, OrderItem } from '@/domain/order/types';

/**
 * Formata cêntimos em string de preço (ex: 1250 → "12.50").
 * Aceita valores já em euros (decimal) ou em cêntimos (inteiro).
 */
function formatPrice(value: number): string {
  // Se o valor parece estar em cêntimos (> 100 e inteiro), converter
  const euros = Number.isInteger(value) && Math.abs(value) >= 100
    ? value / 100
    : value;
  return euros.toFixed(2);
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
 * Calcula o total de uma linha (unitPrice * quantity + modifiers).
 */
function itemLineTotal(item: OrderItem): number {
  const modifiersTotal = (item.modifiers ?? []).reduce((sum, m) => sum + (m.price ?? 0), 0);
  return (item.unitPrice + modifiersTotal) * item.quantity;
}

/**
 * Carrega uma imagem (logo) e converte para bitmap raster 1-bit
 * compatível com ESC/POS (GS v 0).
 *
 * @param url - URL da imagem (relativo ou absoluto)
 * @param maxWidth - Largura máxima em pixels (múltiplo de 8). Default: 200
 */
export async function loadLogoRaster(
  url: string,
  maxWidth = 200,
): Promise<{ width: number; height: number; data: Uint8Array } | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Logo load failed'));
      img.src = url;
    });

    // Scale to maxWidth keeping aspect ratio
    const scale = Math.min(maxWidth / img.width, 1);
    const w = Math.floor(img.width * scale);
    const h = Math.floor(img.height * scale);
    // Width must be multiple of 8
    const rasterWidth = Math.ceil(w / 8) * 8;

    const canvas = document.createElement('canvas');
    canvas.width = rasterWidth;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    // White background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, rasterWidth, h);
    // Center the image
    const offsetX = Math.floor((rasterWidth - w) / 2);
    ctx.drawImage(img, offsetX, 0, w, h);

    const imageData = ctx.getImageData(0, 0, rasterWidth, h);
    const pixels = imageData.data;
    const bytesPerLine = rasterWidth / 8;

    // Floyd-Steinberg dithering for better quality on thermal printers
    const grayscale = new Float32Array(rasterWidth * h);
    for (let i = 0; i < rasterWidth * h; i++) {
      const idx = i * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];
      // If transparent or very dark background with color, treat as white paper
      if (a < 128) {
        grayscale[i] = 255;
      } else {
        grayscale[i] = 0.299 * r + 0.587 * g + 0.114 * b;
      }
    }

    // Floyd-Steinberg dithering
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < rasterWidth; x++) {
        const i = y * rasterWidth + x;
        const oldVal = grayscale[i];
        const newVal = oldVal < 128 ? 0 : 255;
        grayscale[i] = newVal;
        const err = oldVal - newVal;
        if (x + 1 < rasterWidth) grayscale[i + 1] += err * 7 / 16;
        if (y + 1 < h) {
          if (x > 0) grayscale[(y + 1) * rasterWidth + (x - 1)] += err * 3 / 16;
          grayscale[(y + 1) * rasterWidth + x] += err * 5 / 16;
          if (x + 1 < rasterWidth) grayscale[(y + 1) * rasterWidth + (x + 1)] += err * 1 / 16;
        }
      }
    }

    const rasterData = new Uint8Array(bytesPerLine * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < rasterWidth; x++) {
        // After dithering: 0 = black (print), 255 = white (no print)
        if (grayscale[y * rasterWidth + x] < 128) {
          const byteIdx = y * bytesPerLine + Math.floor(x / 8);
          const bitIdx = 7 - (x % 8);
          rasterData[byteIdx] |= 1 << bitIdx;
        }
      }
    }

    return { width: rasterWidth, height: h, data: rasterData };
  } catch {
    return null;
  }
}

/**
 * Gera um recibo de cliente em ESC/POS.
 *
 * @param order - Pedido completo
 * @param restaurant - Identidade do restaurante
 * @param paymentMethod - Método de pagamento (ex: "Dinheiro", "Cartão")
 */
export function buildOrderReceipt(
  order: Order,
  restaurant: RestaurantIdentity,
  paymentMethod?: string,
  options?: ReceiptPrintOptions,
): EscPosBuilder {
  const b = new EscPosBuilder();
  const now = new Date();

  b.init();

  // ---- Logo (se disponível) ----
  if (options?.logoRaster) {
    b.align('center');
    b.rasterImage(
      options.logoRaster.width,
      options.logoRaster.height,
      options.logoRaster.data,
    );
    b.emptyLine();
  }

  // ---- Cabeçalho ----
  b.align('center');
  b.size(2, 2);
  b.bold(true);
  b.text(restaurant.name.toUpperCase());
  b.size(1, 1);
  b.bold(false);

  if (restaurant.address) {
    b.text(restaurant.address);
  }
  if (restaurant.nif) {
    b.text(`NIF: ${restaurant.nif}`);
  }
  if (restaurant.phone) {
    b.text(`Tel: ${restaurant.phone}`);
  }

  b.separator('=');

  // ---- Info do pedido ----
  b.align('left');
  b.columns2('Data:', formatDateTime(now));
  b.columns2('Pedido:', `#${order.id.slice(-6).toUpperCase()}`);
  if (order.tableNumber) {
    b.columns2('Mesa:', String(order.tableNumber));
  }
  if (order.customerName) {
    b.columns2('Cliente:', order.customerName);
  }

  b.separator('-');

  // ---- Itens ----
  b.bold(true);
  b.columns3('QTD', 'ITEM', 'TOTAL');
  b.bold(false);
  b.separator('-');

  for (const item of order.items) {
    const total = itemLineTotal(item);
    b.columns3(
      `${item.quantity}x`,
      item.name,
      formatPrice(total),
    );

    // Preço unitário (se quantidade > 1)
    if (item.quantity > 1) {
      b.text(`      @ ${formatPrice(item.unitPrice)} un.`);
    }

    // Modificadores indentados
    if (item.modifiers && item.modifiers.length > 0) {
      for (const mod of item.modifiers) {
        const modPrice = mod.price > 0 ? ` +${formatPrice(mod.price)}` : '';
        b.text(`      + ${mod.name}${modPrice}`);
      }
    }

    // Notas do item
    if (item.notes) {
      b.text(`      * ${item.notes}`);
    }
  }

  b.separator('=');

  // ---- Totais ----
  b.columns2('Subtotal:', formatPrice(order.subtotal));

  if (order.discount > 0) {
    b.columns2('Desconto:', `-${formatPrice(order.discount)}`);
  }

  b.columns2('IVA:', formatPrice(order.tax));

  b.emptyLine();
  b.bold(true);
  b.size(2, 2);
  b.columns2('TOTAL:', formatPrice(order.total));
  b.size(1, 1);
  b.bold(false);

  b.separator('=');

  // ---- Pagamento ----
  if (paymentMethod) {
    b.columns2('Pagamento:', paymentMethod);
    b.emptyLine();
  }

  // ---- Dados fiscais (quando disponíveis) ----
  if (options?.fiscal) {
    b.separator('-');
    b.columns2('Nr doc:', options.fiscal.documentNumber);
    if (options.fiscal.atcud) {
      b.columns2('ATCUD:', options.fiscal.atcud);
    }
    b.columns2('Hash:', options.fiscal.hashControl);
    b.emptyLine();
  }

  // ---- QR Code com ID do pedido ----
  b.align('center');
  b.emptyLine();
  b.qrCode(order.id, 4);
  b.emptyLine();

  // ---- Rodapé ----
  b.align('center');
  b.text('Obrigado pela preferencia!');

  if (options?.receiptExtraText) {
    b.emptyLine();
    b.text(options.receiptExtraText);
  }

  b.emptyLine();
  b.text(`${formatDateTime(now)}`);

  // ---- Notas do pedido ----
  if (order.notes) {
    b.emptyLine();
    b.text(`Obs: ${order.notes}`);
  }

  b.feed(2);
  b.cut();

  return b;
}

/** Options for fiscal/extra data on the receipt. */
export interface ReceiptPrintOptions {
  fiscal?: {
    documentNumber: string;
    hashControl: string;
    atcud: string;
  };
  receiptExtraText?: string;
  /** Pre-loaded logo raster bitmap for ESC/POS printing. */
  logoRaster?: {
    width: number;
    height: number;
    data: Uint8Array;
  };
}
