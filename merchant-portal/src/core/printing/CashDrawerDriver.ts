/**
 * CashDrawerDriver — Controlo de gaveta de dinheiro via ESC/POS.
 *
 * A gaveta é acionada por um comando ESC/POS enviado à impressora
 * de recibos (a gaveta liga na porta RJ-11 da impressora).
 *
 * Comando ESC p: ESC p m t1 t2
 * - m = pin connector (0 or 1)
 * - t1 = on time  (n × 2ms)
 * - t2 = off time (n × 2ms)
 *
 * Referência: ESC/POS Application Programming Guide (Epson)
 */

/** ESC byte constant */
const ESC = 0x1b;
/** 'p' command byte */
const CMD_P = 0x70;

/**
 * Convert milliseconds to the ESC/POS timer unit (1 unit = 2ms).
 * Clamped to [0, 255] as per spec.
 */
function msToTimerUnit(ms: number): number {
  return Math.min(255, Math.max(0, Math.floor(ms / 2)));
}

export class CashDrawerDriver {
  /**
   * Generate ESC/POS command bytes to open cash drawer.
   *
   * @param pin  - Pin connector on the printer (0 or 1). Default: 0
   * @param onTimeMs  - Pulse ON duration in ms. Default: 200ms
   * @param offTimeMs - Pulse OFF duration in ms. Default: 200ms
   * @returns Uint8Array with the 5-byte ESC p command
   */
  static openCommand(
    pin: 0 | 1 = 0,
    onTimeMs: number = 200,
    offTimeMs: number = 200,
  ): Uint8Array {
    const t1 = msToTimerUnit(onTimeMs);
    const t2 = msToTimerUnit(offTimeMs);
    return new Uint8Array([ESC, CMD_P, pin, t1, t2]);
  }

  /**
   * Open drawer via WebUSB transport.
   *
   * Requires an active USB connection to a receipt printer.
   * The printer must be claimed and have an OUT endpoint available.
   *
   * @param device - A paired USBDevice (from navigator.usb.requestDevice)
   * @throws Error if the device is not opened, has no configuration, or transfer fails
   */
  static async openViaUSB(device: USBDevice): Promise<void> {
    if (!device.opened) {
      await device.open();
    }

    // Select the first configuration if not already selected
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    // Find the first OUT bulk endpoint
    const iface = device.configuration?.interfaces[0];
    if (!iface) {
      throw new Error(
        "CashDrawerDriver: No USB interface found on the printer device.",
      );
    }

    const interfaceNumber = iface.interfaceNumber;
    await device.claimInterface(interfaceNumber);

    const outEndpoint = iface.alternate.endpoints.find(
      (ep) => ep.direction === "out" && ep.type === "bulk",
    );

    if (!outEndpoint) {
      throw new Error(
        "CashDrawerDriver: No bulk OUT endpoint found. Ensure the printer supports ESC/POS via USB.",
      );
    }

    const command = CashDrawerDriver.openCommand();
    await device.transferOut(outEndpoint.endpointNumber, command);
  }

  /**
   * Open drawer via network printer (TCP socket via fetch to Core proxy).
   *
   * For network-connected printers, sends the ESC/POS command through
   * the Core printing proxy endpoint. The proxy forwards raw bytes
   * to the printer's TCP port.
   *
   * @param printerIp - IP address of the network printer
   * @param port - TCP port (default: 9100, standard RAW printing port)
   * @throws Error if the proxy request fails
   */
  static async openViaNetwork(
    printerIp: string,
    port: number = 9100,
  ): Promise<void> {
    const command = CashDrawerDriver.openCommand();

    // Convert Uint8Array to base64 for JSON transport
    const base64Command = btoa(
      String.fromCharCode(...Array.from(command)),
    );

    const response = await fetch("/api/print/raw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        printerIp,
        port,
        data: base64Command,
        encoding: "base64",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      throw new Error(
        `CashDrawerDriver: Network print failed (${response.status}): ${errorBody}`,
      );
    }
  }
}
