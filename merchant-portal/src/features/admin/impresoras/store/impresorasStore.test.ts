/**
 * impresorasStore unit tests
 */
import { beforeEach, describe, expect, it } from "vitest";
import { impresorasStore } from "./impresorasStore";

const PRINTERS_KEY = "chefiapp_impresoras";
const ROUTES_KEY = "chefiapp_impresoras_routes";

beforeEach(() => {
  localStorage.clear();
});

// ─── Printers ────────────────────────────────────────────────────────────────

describe("addPrinter", () => {
  it("stores a new printer with defaults", () => {
    const p = impresorasStore.addPrinter("Impressora 1", "térmica", "USB");
    expect(p.name).toBe("Impressora 1");
    expect(p.type).toBe("térmica");
    expect(p.connection).toBe("USB");
    expect(p.isActive).toBe(true);
    expect(p.ip).toBeUndefined();
    expect(p.port).toBeUndefined();
    expect(p.id).toMatch(/^prn-/);
  });

  it("persists correctly so getPrinters returns it", () => {
    impresorasStore.addPrinter("P1", "térmica", "USB");
    expect(impresorasStore.getPrinters()).toHaveLength(1);
  });

  it("accumulates multiple printers", () => {
    impresorasStore.addPrinter("P1", "térmica", "USB");
    impresorasStore.addPrinter("P2", "laser", "Rede");
    expect(impresorasStore.getPrinters()).toHaveLength(2);
  });
});

describe("updatePrinter", () => {
  it("updates ip and port", () => {
    const p = impresorasStore.addPrinter("Net Printer", "térmica", "Rede");
    impresorasStore.updatePrinter(p.id, { ip: "192.168.1.100", port: 9100 });
    const updated = impresorasStore.getPrinters().find((x) => x.id === p.id)!;
    expect(updated.ip).toBe("192.168.1.100");
    expect(updated.port).toBe(9100);
  });

  it("only patches specified fields, leaves others intact", () => {
    const p = impresorasStore.addPrinter("My Printer", "térmica", "USB");
    impresorasStore.updatePrinter(p.id, { ip: "10.0.0.5" });
    const updated = impresorasStore.getPrinters().find((x) => x.id === p.id)!;
    expect(updated.name).toBe("My Printer");
    expect(updated.connection).toBe("USB");
    expect(updated.ip).toBe("10.0.0.5");
  });

  it("refreshes updatedAt timestamp", () => {
    const before = Date.now();
    const p = impresorasStore.addPrinter("P", "térmica", "USB");
    impresorasStore.updatePrinter(p.id, { name: "Updated" });
    const updated = impresorasStore.getPrinters().find((x) => x.id === p.id)!;
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      before,
    );
  });

  it("does nothing when id not found", () => {
    impresorasStore.addPrinter("P1", "térmica", "USB");
    impresorasStore.updatePrinter("non-existent-id", { ip: "1.2.3.4" });
    // count unchanged
    expect(impresorasStore.getPrinters()).toHaveLength(1);
  });

  it("can clear ip/port by setting to null", () => {
    const p = impresorasStore.addPrinter("P", "térmica", "Rede");
    impresorasStore.updatePrinter(p.id, { ip: "10.0.0.1", port: 9100 });
    impresorasStore.updatePrinter(p.id, { ip: null, port: null });
    const updated = impresorasStore.getPrinters().find((x) => x.id === p.id)!;
    expect(updated.ip).toBeNull();
    expect(updated.port).toBeNull();
  });
});

describe("deletePrinter", () => {
  it("removes the printer", () => {
    const p = impresorasStore.addPrinter("To Delete", "térmica", "USB");
    impresorasStore.deletePrinter(p.id);
    expect(impresorasStore.getPrinters()).toHaveLength(0);
  });

  it("cascades: removes routes belonging to the deleted printer", () => {
    const p = impresorasStore.addPrinter("P", "térmica", "USB");
    impresorasStore.addRoute("Comanda Cozinha", p.id, "order_placed");
    impresorasStore.addRoute("Recibo", p.id, "payment_complete");
    impresorasStore.deletePrinter(p.id);
    expect(impresorasStore.getRoutes()).toHaveLength(0);
  });

  it("keeps routes for other printers on delete", () => {
    const p1 = impresorasStore.addPrinter("P1", "térmica", "USB");
    const p2 = impresorasStore.addPrinter("P2", "laser", "Rede");
    impresorasStore.addRoute("Route P1", p1.id, "order_placed");
    impresorasStore.addRoute("Route P2", p2.id, "order_placed");
    impresorasStore.deletePrinter(p1.id);
    const remaining = impresorasStore.getRoutes();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].printerId).toBe(p2.id);
  });
});

// ─── Routes ──────────────────────────────────────────────────────────────────

describe("addRoute / getRoutes", () => {
  it("stores a new route", () => {
    const p = impresorasStore.addPrinter("P", "térmica", "USB");
    const r = impresorasStore.addRoute("Comanda", p.id, "order_placed");
    expect(r.name).toBe("Comanda");
    expect(r.printerId).toBe(p.id);
    expect(r.trigger).toBe("order_placed");
    expect(r.id).toMatch(/^route-/); // unique UUID suffix
  });
});

describe("deleteRoute", () => {
  it("removes by id", () => {
    const p = impresorasStore.addPrinter("P", "térmica", "USB");
    const r = impresorasStore.addRoute("R1", p.id, "order_placed");
    impresorasStore.addRoute("R2", p.id, "payment_complete");
    impresorasStore.deleteRoute(r.id);
    expect(impresorasStore.getRoutes()).toHaveLength(1);
    expect(impresorasStore.getRoutes()[0].name).toBe("R2");
  });
});

// ─── Resilience ──────────────────────────────────────────────────────────────

describe("resilience: corrupt localStorage", () => {
  it("getPrinters returns [] on corrupt data", () => {
    localStorage.setItem(PRINTERS_KEY, "not-json");
    expect(impresorasStore.getPrinters()).toEqual([]);
  });

  it("getRoutes returns [] on corrupt data", () => {
    localStorage.setItem(ROUTES_KEY, "not-json");
    expect(impresorasStore.getRoutes()).toEqual([]);
  });
});
