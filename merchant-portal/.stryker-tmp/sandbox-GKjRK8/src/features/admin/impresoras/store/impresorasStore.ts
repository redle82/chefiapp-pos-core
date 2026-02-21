/**
 * Store Impresoras: localStorage; depois API.
 */

import type { Printer, PrintRoute } from "../types";

const PRINTERS_KEY = "chefiapp_impresoras";
const ROUTES_KEY = "chefiapp_impresoras_routes";

function loadPrinters(): Printer[] {
  try {
    const raw = localStorage.getItem(PRINTERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Printer[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadRoutes(): PrintRoute[] {
  try {
    const raw = localStorage.getItem(ROUTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PrintRoute[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const impresorasStore = {
  getPrinters(): Printer[] {
    return loadPrinters();
  },
  addPrinter(name: string, type: string, connection: string): Printer {
    const list = loadPrinters();
    const now = new Date().toISOString();
    const id = `prn-${Date.now()}`;
    const printer: Printer = { id, name, type, connection, isActive: true, createdAt: now, updatedAt: now };
    list.push(printer);
    localStorage.setItem(PRINTERS_KEY, JSON.stringify(list));
    return printer;
  },
  deletePrinter(id: string): void {
    const list = loadPrinters().filter((p) => p.id !== id);
    localStorage.setItem(PRINTERS_KEY, JSON.stringify(list));
    const routes = loadRoutes().filter((r) => r.printerId !== id);
    localStorage.setItem(ROUTES_KEY, JSON.stringify(routes));
  },
  getRoutes(): PrintRoute[] {
    return loadRoutes();
  },
  addRoute(name: string, printerId: string, trigger: string): PrintRoute {
    const list = loadRoutes();
    const now = new Date().toISOString();
    const id = `route-${Date.now()}`;
    const route: PrintRoute = { id, name, printerId, trigger, createdAt: now, updatedAt: now };
    list.push(route);
    localStorage.setItem(ROUTES_KEY, JSON.stringify(list));
    return route;
  },
  deleteRoute(id: string): void {
    const list = loadRoutes().filter((r) => r.id !== id);
    localStorage.setItem(ROUTES_KEY, JSON.stringify(list));
  },
};
