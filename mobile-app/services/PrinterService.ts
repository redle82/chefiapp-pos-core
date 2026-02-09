import EscPosEncoder from "esc-pos-encoder";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";

let TcpSocket: any;
try {
  TcpSocket = require("react-native-tcp-socket").default;
} catch (e) {
  console.warn(
    "PrinterService: react-native-tcp-socket not found (Native Module missing). Printing will be disabled.",
  );
  TcpSocket = {
    createConnection: () => ({
      on: () => {},
      write: () => {},
      destroy: () => {},
      end: () => {},
    }),
  };
}

const PRINTER_CONFIG_KEY = "printer_config";
// Forced refresh for bundler

interface PrinterConfig {
  host: string;
  port: number;
}

export class PrinterService {
  private socket: any = null;
  private currentHost: string | null = null;
  private isConnected: boolean = false;

  /**
   * Get stored restaurant name from AsyncStorage (set during onboarding/config).
   * Falls back to generic label.
   */
  private async getStoredRestaurantName(): Promise<string> {
    try {
      const name = await AsyncStorage.getItem("@chefiapp_restaurant_name");
      return name || "Restaurante";
    } catch {
      return "Restaurante";
    }
  }

  async getConfig(type: "KITCHEN" | "COUNTER") {
    try {
      const portStr =
        (await AsyncStorage.getItem("@chefiapp_printer_port")) || "9100";
      const port = parseInt(portStr, 10);

      let host = "";
      if (type === "KITCHEN") {
        host =
          (await AsyncStorage.getItem("@chefiapp_kitchen_ip")) ||
          "192.168.1.200";
      } else {
        host =
          (await AsyncStorage.getItem("@chefiapp_counter_ip")) ||
          "192.168.1.201";
      }
      return { host, port };
    } catch (e) {
      console.error("Config Load Error", e);
      return { host: "192.168.1.200", port: 9100 };
    }
  }

  async connect(type: "KITCHEN" | "COUNTER"): Promise<boolean> {
    const config = await this.getConfig(type);

    // If already connected to the same host, reuse
    if (this.isConnected && this.socket && this.currentHost === config.host) {
      return true;
    }

    // specific disconnect if connected to different host
    this.disconnect();

    return new Promise((resolve) => {
      this.socket = TcpSocket.createConnection(
        {
          port: config.port,
          host: config.host,
          tls: false,
        },
        () => {
          this.isConnected = true;
          this.currentHost = config.host;
          resolve(true);
        },
      );

      this.socket.on("error", (error: any) => {
        console.error(`Printer Connection Error (${type})`, error);
        this.isConnected = false;
        resolve(false);
      });

      this.socket.on("close", () => {
        this.isConnected = false;
        this.socket = null;
        this.currentHost = null;
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
      this.isConnected = false;
      this.currentHost = null;
    }
  }

  async printTest(type: "KITCHEN" | "COUNTER"): Promise<boolean> {
    try {
      const connected = await this.connect(type);
      if (!connected) return false;

      const encoder = new EscPosEncoder();
      const commands = encoder
        .initialize()
        .align("center")
        .bold(true)
        .line(`TESTE DE IMPRESSAO`)
        .line(type)
        .bold(false)
        .line(new Date().toLocaleString())
        .newline()
        .cut();

      const buffer = Buffer.from(commands.encode());
      this.socket.write(buffer);
      return true;
    } catch (e) {
      console.error("Test Print Error", e);
      return false;
    }
  }

  async printTicket(
    table: string,
    items: any[],
    ticketId?: number | string,
  ): Promise<boolean> {
    try {
      const connected = await this.connect("KITCHEN");
      if (!connected)
        throw new Error(
          "Falha ao conectar com a impressora (Cozinha). Verifique o IP.",
        );

      const displayId = ticketId ?? Math.floor(Math.random() * 1000);
      const encoder = new EscPosEncoder();
      const commands = encoder
        .initialize()
        .align("center")
        .bold(true)
        .line(`TICKET #${displayId}`)
        .line(`MESA ${table}`)
        .bold(false)
        .line(new Date().toLocaleTimeString())
        .line("--------------------------------")
        .align("left");

      items.forEach((item) => {
        commands
          .bold(true)
          .text(`${item.quantity}x ${item.name}`)
          .newline()
          .bold(false);

        if (item.notes) {
          commands.text(`   OBS: ${item.notes}`).newline();
        }
      });

      commands
        .line("--------------------------------")
        .newline()
        .newline()
        .newline()
        .cut();

      const buffer = Buffer.from(commands.encode());
      this.socket.write(buffer);
      return true;
    } catch (e: any) {
      console.error("Print Error", e);
      throw new Error(`Erro na Impressão: ${e.message || "Desconhecido"}`);
    }
  }

  async printReceipt(order: any, restaurantName?: string): Promise<boolean> {
    try {
      const connected = await this.connect("COUNTER");
      if (!connected) return false;

      const displayName =
        restaurantName ||
        order.restaurant_name ||
        (await this.getStoredRestaurantName());
      const currencySymbol = order.currency_symbol || "€";
      const encoder = new EscPosEncoder();
      const commands = encoder
        .initialize()
        .align("center")
        .bold(true)
        .line(displayName)
        .line("Recibo de Pagamento")
        .bold(false)
        .line(new Date().toLocaleString())
        .line("--------------------------------")
        .align("left");

      order.items.forEach((item: any) => {
        commands
          .text(
            `${item.quantity}x ${item.name}   ${currencySymbol}${(
              item.price * item.quantity
            ).toFixed(2)}`,
          )
          .newline();
      });

      commands
        .line("--------------------------------")
        .align("right")
        .bold(true)
        .line(
          `TOTAL: ${currencySymbol}${(order.total_amount / 100).toFixed(2)}`,
        )
        .bold(false)
        .align("center")
        .newline()
        .line("Obrigado pela preferência!")
        .newline()
        .newline()
        .cut();

      const buffer = Buffer.from(commands.encode());
      this.socket.write(buffer);
      return true;
    } catch (e) {
      console.error("Receipt Print Error", e);
      return false;
    }
  }

  async kickDrawer(): Promise<boolean> {
    try {
      // Connect to COUNTER printer (usually where drawer is)
      const connected = await this.connect("COUNTER");
      if (!connected) return false;

      // Standard ESC/POS Command to Pulse Pin 2 (Drawer 1)
      // ESC p m t1 t2
      // 27 112 0 25 250 (decimal)
      // 0x1B 0x70 0x00 0x19 0xFA (hex)
      const command = Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]);

      this.socket.write(command);
      return true;
    } catch (e) {
      console.error("Kick Drawer Error", e);
      return false;
    }
  }
}

export const printerService = new PrinterService();
