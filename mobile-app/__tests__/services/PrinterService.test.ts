/**
 * PrinterService — Unit tests
 *
 * Tests config loading, connect/disconnect, printTest, printTicket, printReceipt, kickDrawer.
 * Native modules are mocked via __mocks__/setup.ts.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PrinterService } from "../../services/PrinterService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let mockSocket: {
  on: jest.Mock;
  write: jest.Mock;
  destroy: jest.Mock;
  end: jest.Mock;
};

// Get TcpSocket mock
const TcpSocket = require("react-native-tcp-socket").default;

function setupSocket(connectCb?: () => void) {
  mockSocket = {
    on: jest.fn(),
    write: jest.fn(),
    destroy: jest.fn(),
    end: jest.fn(),
  };
  TcpSocket.createConnection.mockImplementation(
    (_opts: any, cb: () => void) => {
      if (connectCb) setTimeout(connectCb, 0);
      else setTimeout(cb, 0);
      return mockSocket;
    },
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("PrinterService", () => {
  let printer: PrinterService;

  beforeEach(() => {
    jest.clearAllMocks();
    printer = new PrinterService();
    setupSocket();
  });

  // -- getConfig --
  describe("getConfig", () => {
    it("returns defaults when nothing stored", async () => {
      const config = await printer.getConfig("KITCHEN");
      expect(config.host).toBe("192.168.1.200");
      expect(config.port).toBe(9100);
    });

    it("reads COUNTER IP from AsyncStorage", async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("9101") // port
        .mockResolvedValueOnce("10.0.0.5"); // counter ip
      const config = await printer.getConfig("COUNTER");
      expect(config.host).toBe("10.0.0.5");
      expect(config.port).toBe(9101);
    });

    it("reads KITCHEN IP from AsyncStorage", async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("9100") // port
        .mockResolvedValueOnce("10.0.0.10"); // kitchen ip
      const config = await printer.getConfig("KITCHEN");
      expect(config.host).toBe("10.0.0.10");
    });

    it("falls back on storage error", async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error("storage error"),
      );
      const config = await printer.getConfig("KITCHEN");
      expect(config.host).toBe("192.168.1.200");
      expect(config.port).toBe(9100);
    });
  });

  // -- connect/disconnect --
  describe("connect / disconnect", () => {
    it("connects to KITCHEN", async () => {
      const result = await printer.connect("KITCHEN");
      expect(result).toBe(true);
      expect(TcpSocket.createConnection).toHaveBeenCalledTimes(1);
    });

    it("reuses socket for same host", async () => {
      await printer.connect("KITCHEN");
      const result2 = await printer.connect("KITCHEN");
      expect(result2).toBe(true);
      // Only one createConnection call because same host
      expect(TcpSocket.createConnection).toHaveBeenCalledTimes(1);
    });

    it("disconnects and reconnects on host change", async () => {
      await printer.connect("KITCHEN");
      // Change to COUNTER (different IP)
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("9100")
        .mockResolvedValueOnce("192.168.1.201");
      await printer.connect("COUNTER");
      expect(mockSocket.destroy).toHaveBeenCalled();
    });

    it("disconnect clears socket state", () => {
      // Set up socket manually through connect
      (printer as any).socket = mockSocket;
      (printer as any).isConnected = true;
      (printer as any).currentHost = "192.168.1.200";
      printer.disconnect();
      expect(mockSocket.destroy).toHaveBeenCalled();
      expect((printer as any).socket).toBeNull();
      expect((printer as any).isConnected).toBe(false);
    });

    it("returns false when connection error", async () => {
      TcpSocket.createConnection.mockImplementation((_opts: any, _cb: any) => {
        const socket = {
          on: jest.fn((event: string, handler: any) => {
            if (event === "error")
              setTimeout(() => handler(new Error("fail")), 0);
          }),
          write: jest.fn(),
          destroy: jest.fn(),
          end: jest.fn(),
        };
        return socket;
      });
      const result = await printer.connect("KITCHEN");
      expect(result).toBe(false);
    });
  });

  // -- printTest --
  describe("printTest", () => {
    it("returns true on successful print", async () => {
      const result = await printer.printTest("KITCHEN");
      expect(result).toBe(true);
      expect(mockSocket.write).toHaveBeenCalled();
    });

    it("returns false when not connected", async () => {
      TcpSocket.createConnection.mockImplementation((_opts: any, _cb: any) => {
        const socket = {
          on: jest.fn((event: string, handler: any) => {
            if (event === "error")
              setTimeout(() => handler(new Error("fail")), 0);
          }),
          write: jest.fn(),
          destroy: jest.fn(),
          end: jest.fn(),
        };
        return socket;
      });
      const result = await printer.printTest("COUNTER");
      expect(result).toBe(false);
    });
  });

  // -- printTicket --
  describe("printTicket", () => {
    it("prints a kitchen ticket", async () => {
      const items = [
        { quantity: 2, name: "Bifana", notes: "sem cebola" },
        { quantity: 1, name: "Coca-Cola", notes: "" },
      ];
      const result = await printer.printTicket("5", items);
      expect(result).toBe(true);
      expect(mockSocket.write).toHaveBeenCalled();
    });

    it("throws on connection failure", async () => {
      TcpSocket.createConnection.mockImplementation((_opts: any, _cb: any) => {
        const socket = {
          on: jest.fn((event: string, handler: any) => {
            if (event === "error")
              setTimeout(() => handler(new Error("fail")), 0);
          }),
          write: jest.fn(),
          destroy: jest.fn(),
          end: jest.fn(),
        };
        return socket;
      });
      await expect(printer.printTicket("1", [])).rejects.toThrow("Impressão");
    });
  });

  // -- printReceipt --
  describe("printReceipt", () => {
    it("prints a receipt", async () => {
      const order = {
        items: [{ quantity: 1, name: "Francesinha", price: 12.5 }],
        total_amount: 1250,
      };
      const result = await printer.printReceipt(order);
      expect(result).toBe(true);
      expect(mockSocket.write).toHaveBeenCalled();
    });

    it("returns false on connection failure", async () => {
      TcpSocket.createConnection.mockImplementation((_opts: any, _cb: any) => {
        const socket = {
          on: jest.fn((event: string, handler: any) => {
            if (event === "error")
              setTimeout(() => handler(new Error("fail")), 0);
          }),
          write: jest.fn(),
          destroy: jest.fn(),
          end: jest.fn(),
        };
        return socket;
      });
      const result = await printer.printReceipt({ items: [], total_amount: 0 });
      expect(result).toBe(false);
    });
  });

  // -- kickDrawer --
  describe("kickDrawer", () => {
    it("sends ESC/POS drawer pulse", async () => {
      const result = await printer.kickDrawer();
      expect(result).toBe(true);
      const written = mockSocket.write.mock.calls[0][0];
      // ESC p 0 25 250 = drawer kick
      expect(written[0]).toBe(0x1b);
      expect(written[1]).toBe(0x70);
    });

    it("returns false on error", async () => {
      TcpSocket.createConnection.mockImplementation((_opts: any, _cb: any) => {
        const socket = {
          on: jest.fn((event: string, handler: any) => {
            if (event === "error")
              setTimeout(() => handler(new Error("fail")), 0);
          }),
          write: jest.fn(),
          destroy: jest.fn(),
          end: jest.fn(),
        };
        return socket;
      });
      const result = await printer.kickDrawer();
      expect(result).toBe(false);
    });
  });
});
