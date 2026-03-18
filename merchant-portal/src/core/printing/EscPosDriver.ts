/**
 * ESC/POS Driver — Construtor de comandos binários para impressoras térmicas.
 *
 * Gera um Uint8Array com comandos ESC/POS nativos.
 * Sem dependências externas — cada byte é calculado manualmente.
 *
 * Referência: Epson ESC/POS Command Reference (TM-T88V)
 *
 * Codificação: CP858 (Europa Ocidental com €) para suporte a caracteres
 * portugueses (ã, ç, é, ê, õ, ú, etc.).
 */

// ---------------------------------------------------------------------------
// Tabela de mapeamento Unicode → CP858
// Contém apenas os codepoints que diferem de ASCII (0x00–0x7F)
// ---------------------------------------------------------------------------
const UNICODE_TO_CP858: Record<number, number> = {
  0x00c7: 0x80, // Ç
  0x00fc: 0x81, // ü
  0x00e9: 0x82, // é
  0x00e2: 0x83, // â
  0x00e4: 0x84, // ä
  0x00e0: 0x85, // à
  0x00e5: 0x86, // å
  0x00e7: 0x87, // ç
  0x00ea: 0x88, // ê
  0x00eb: 0x89, // ë
  0x00e8: 0x8a, // è
  0x00ef: 0x8b, // ï
  0x00ee: 0x8c, // î
  0x00ec: 0x8d, // ì
  0x00c4: 0x8e, // Ä
  0x00c5: 0x8f, // Å
  0x00c9: 0x90, // É
  0x00e6: 0x91, // æ
  0x00c6: 0x92, // Æ
  0x00f4: 0x93, // ô
  0x00f6: 0x94, // ö
  0x00f2: 0x95, // ò
  0x00fb: 0x96, // û
  0x00f9: 0x97, // ù
  0x00ff: 0x98, // ÿ
  0x00d6: 0x99, // Ö
  0x00dc: 0x9a, // Ü
  0x00f8: 0x9b, // ø
  0x00a3: 0x9c, // £
  0x00d8: 0x9d, // Ø
  0x00a7: 0x15, // §
  0x00e1: 0xa0, // á
  0x00ed: 0xa1, // í
  0x00f3: 0xa2, // ó
  0x00fa: 0xa3, // ú
  0x00f1: 0xa4, // ñ
  0x00d1: 0xa5, // Ñ
  0x00aa: 0xa6, // ª
  0x00ba: 0xa7, // º
  0x00bf: 0xa8, // ¿
  0x00e3: 0xc6, // ã (CP858 position)
  0x00c3: 0xc7, // Ã
  0x00f5: 0xe4, // õ (CP858 position — mapped to ∑ slot, common on Epson)
  0x00d5: 0xe5, // Õ
  0x20ac: 0xd5, // € (CP858 replaces ı at 0xD5 with €)
  0x00c0: 0xb7, // À
  0x00c1: 0xb5, // Á
  0x00c2: 0xb6, // Â
  0x00ca: 0xd2, // Ê
  0x00cd: 0xd6, // Í
  0x00d3: 0xe0, // Ó
  0x00da: 0xe9, // Ú
};

/**
 * Converte uma string Unicode em bytes CP858.
 * Caracteres sem mapeamento são substituídos por '?'.
 */
function encodeCP858(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else {
      bytes.push(UNICODE_TO_CP858[code] ?? 0x3f); // '?' como fallback
    }
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Constantes ESC/POS
// ---------------------------------------------------------------------------
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
const DLE = 0x10;

/** Largura padrão em colunas para papel de 80mm (Font A) */
const DEFAULT_COLUMNS = 48;

/**
 * Construtor fluente de comandos ESC/POS.
 *
 * Uso:
 * ```ts
 * const data = new EscPosBuilder()
 *   .init()
 *   .align('center')
 *   .size(2, 2)
 *   .text('RESTAURANTE')
 *   .size(1, 1)
 *   .feed(2)
 *   .cut()
 *   .build();
 * ```
 */
export class EscPosBuilder {
  private buffer: number[] = [];
  private columns: number = DEFAULT_COLUMNS;

  /**
   * Define a largura do papel em colunas.
   * 48 para 80mm (Font A), 42 para 80mm (Font B), 32 para 58mm.
   */
  setColumns(cols: number): this {
    this.columns = cols;
    return this;
  }

  // -------------------------------------------------------------------------
  // Inicialização
  // -------------------------------------------------------------------------

  /** ESC @ — Inicializa a impressora (reset de formatação) */
  init(): this {
    this.buffer.push(ESC, 0x40);
    // Seleccionar code page CP858 (página 19 na Epson, varia por fabricante)
    // ESC t n — Selecciona tabela de caracteres
    this.buffer.push(ESC, 0x74, 19);
    return this;
  }

  // -------------------------------------------------------------------------
  // Texto e formatação
  // -------------------------------------------------------------------------

  /** Escreve texto codificado em CP858 + LF */
  text(str: string): this {
    this.buffer.push(...encodeCP858(str), LF);
    return this;
  }

  /** Escreve texto sem line feed (para composição manual) */
  raw(str: string): this {
    this.buffer.push(...encodeCP858(str));
    return this;
  }

  /** ESC E n — Negrito ligado/desligado */
  bold(on: boolean): this {
    this.buffer.push(ESC, 0x45, on ? 1 : 0);
    return this;
  }

  /**
   * GS ! n — Tamanho do caractere.
   * width e height: 1 (normal) ou 2 (duplo).
   */
  size(width: 1 | 2, height: 1 | 2): this {
    const w = (width - 1) & 0x07;
    const h = (height - 1) & 0x07;
    const n = (w << 4) | h;
    this.buffer.push(GS, 0x21, n);
    return this;
  }

  /** ESC a n — Alinhamento: left=0, center=1, right=2 */
  align(alignment: 'left' | 'center' | 'right'): this {
    const n = alignment === 'left' ? 0 : alignment === 'center' ? 1 : 2;
    this.buffer.push(ESC, 0x61, n);
    return this;
  }

  /** ESC - n — Sublinhado ligado/desligado */
  underline(on: boolean): this {
    this.buffer.push(ESC, 0x2d, on ? 1 : 0);
    return this;
  }

  /** GS B n — Inversão branco/preto ligado/desligado */
  invert(on: boolean): this {
    this.buffer.push(GS, 0x42, on ? 1 : 0);
    return this;
  }

  // -------------------------------------------------------------------------
  // Alimentação e corte
  // -------------------------------------------------------------------------

  /** ESC d n — Alimenta n linhas (default: 1) */
  feed(lines: number = 1): this {
    this.buffer.push(ESC, 0x64, Math.max(0, Math.min(255, lines)));
    return this;
  }

  /**
   * GS V — Corte de papel.
   * 'full' = corte total (m=0), 'partial' = corte parcial (m=1).
   * Alimenta 3 linhas antes do corte para não cortar em cima do texto.
   */
  cut(mode: 'full' | 'partial' = 'partial'): this {
    this.feed(3);
    this.buffer.push(GS, 0x56, mode === 'full' ? 0 : 1);
    return this;
  }

  // -------------------------------------------------------------------------
  // Gaveta de dinheiro
  // -------------------------------------------------------------------------

  /**
   * ESC p m t1 t2 — Abre gaveta de dinheiro.
   * pin: 0 = conector 1, 1 = conector 2.
   * Tempos de pulso: t1=25 (~50ms), t2=250 (~500ms).
   */
  openDrawer(pin: 0 | 1 = 0): this {
    this.buffer.push(ESC, 0x70, pin, 25, 250);
    return this;
  }

  // -------------------------------------------------------------------------
  // QR Code (nativo ESC/POS — função GS ( k)
  // -------------------------------------------------------------------------

  /**
   * Imprime QR Code usando comandos nativos GS ( k.
   *
   * Sequência:
   * 1. Seleccionar modelo 2
   * 2. Definir tamanho do módulo
   * 3. Definir nível de correcção (L)
   * 4. Armazenar dados
   * 5. Imprimir
   *
   * @param data - Conteúdo do QR code
   * @param moduleSize - Tamanho do módulo (1–16, default: 4)
   */
  qrCode(data: string, moduleSize: number = 4): this {
    const encoded = encodeCP858(data);
    const dataLen = encoded.length;

    // Função 165: Seleccionar modelo QR Code (Model 2)
    this.buffer.push(GS, 0x28, 0x6b, 4, 0, 0x31, 0x41, 0x32, 0x00);

    // Função 167: Definir tamanho do módulo
    this.buffer.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x43, Math.min(16, Math.max(1, moduleSize)));

    // Função 169: Definir nível de correcção de erro (48=L, 49=M, 50=Q, 51=H)
    this.buffer.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x45, 0x31); // M level

    // Função 180: Armazenar dados no buffer de símbolos
    const storeLen = dataLen + 3;
    const pL = storeLen & 0xff;
    const pH = (storeLen >> 8) & 0xff;
    this.buffer.push(GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...encoded);

    // Função 181: Imprimir o símbolo armazenado
    this.buffer.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30);

    return this;
  }

  // -------------------------------------------------------------------------
  // Código de barras
  // -------------------------------------------------------------------------

  /**
   * Imprime código de barras CODE128.
   *
   * GS H n — Posição do texto HRI (0=não imprime, 2=abaixo)
   * GS h n — Altura em dots
   * GS w n — Largura do módulo
   * GS k m n d1...dn — Imprimir código de barras
   *
   * @param data - Dados do código de barras (ASCII)
   * @param height - Altura em dots (default: 60)
   */
  barcode(data: string, type: 'CODE128' = 'CODE128', height: number = 60): this {
    const encoded = encodeCP858(data);

    // Posição HRI: abaixo do código
    this.buffer.push(GS, 0x48, 2);

    // Altura
    this.buffer.push(GS, 0x68, Math.min(255, Math.max(1, height)));

    // Largura do módulo (2 = médio)
    this.buffer.push(GS, 0x77, 2);

    // CODE128 = tipo 73 (0x49)
    // Formato: GS k 73 n d1...dn
    this.buffer.push(GS, 0x6b, 0x49, encoded.length, ...encoded);

    this.buffer.push(LF);
    return this;
  }

  // -------------------------------------------------------------------------
  // Separadores e linhas
  // -------------------------------------------------------------------------

  /**
   * Imprime uma linha separadora.
   * @param char - Caractere do separador (default: '-')
   * @param width - Largura em colunas (default: largura do papel)
   */
  separator(char: string = '-', width?: number): this {
    const cols = width ?? this.columns;
    const line = char.repeat(cols);
    return this.text(line);
  }

  /**
   * Imprime duas colunas: texto à esquerda e à direita, com espaço no meio.
   * Ideal para linhas como "Subtotal          12.50€".
   */
  columns2(left: string, right: string, colWidth?: number): this {
    const cols = colWidth ?? this.columns;
    const space = cols - left.length - right.length;
    if (space <= 0) {
      return this.text(left + right);
    }
    return this.text(left + ' '.repeat(space) + right);
  }

  /**
   * Imprime três colunas: quantidade, nome e preço.
   * Ideal para linhas de itens: "2x  Bife à portuguesa    25.00€"
   */
  columns3(qty: string, name: string, price: string, colWidth?: number): this {
    const cols = colWidth ?? this.columns;
    const qtyPart = qty.padEnd(5);
    const available = cols - qtyPart.length - price.length;
    const namePart = name.length > available
      ? name.substring(0, available)
      : name + ' '.repeat(available - name.length);
    return this.text(qtyPart + namePart + price);
  }

  /**
   * Imprime uma linha vazia (apenas LF).
   */
  emptyLine(): this {
    this.buffer.push(LF);
    return this;
  }

  // -------------------------------------------------------------------------
  // Imagem raster (logo)
  // -------------------------------------------------------------------------

  /**
   * Imprime uma imagem raster em modo bit-image.
   *
   * GS v 0 m xL xH yL yH d1...dk
   * m=0 (normal), m=1 (double width), m=2 (double height), m=3 (quadruple)
   *
   * @param width - Largura da imagem em pixels (deve ser múltiplo de 8)
   * @param height - Altura da imagem em pixels
   * @param data - Dados raster (1 bit por pixel, MSB primeiro)
   */
  rasterImage(width: number, height: number, data: Uint8Array): this {
    const bytesPerLine = Math.ceil(width / 8);
    const xL = bytesPerLine & 0xff;
    const xH = (bytesPerLine >> 8) & 0xff;
    const yL = height & 0xff;
    const yH = (height >> 8) & 0xff;

    this.buffer.push(GS, 0x76, 0x30, 0, xL, xH, yL, yH, ...Array.from(data));
    return this;
  }

  // -------------------------------------------------------------------------
  // Status
  // -------------------------------------------------------------------------

  /** DLE EOT n — Transmissão de estado em tempo real (usado para heartbeat) */
  requestStatus(): this {
    this.buffer.push(DLE, 0x04, 1);
    return this;
  }

  // -------------------------------------------------------------------------
  // Build
  // -------------------------------------------------------------------------

  /** Constrói o Uint8Array final com todos os comandos acumulados. */
  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
