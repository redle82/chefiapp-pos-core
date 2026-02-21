/**
 * Store Marcas: localStorage; depois API.
 */

import type { Brand } from "../types";

const MAIN_KEY = "chefiapp_marca_principal";
const SUBS_KEY = "chefiapp_sub_marcas";

function loadMain(): Brand | null {
  try {
    const raw = localStorage.getItem(MAIN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Brand;
  } catch {
    return null;
  }
}

function loadSubs(): Brand[] {
  try {
    const raw = localStorage.getItem(SUBS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Brand[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const marcasStore = {
  getMain(): Brand | null {
    return loadMain();
  },
  saveMain(data: { name: string; description: string }): Brand {
    const now = new Date().toISOString();
    const existing = loadMain();
    const brand: Brand = {
      id: existing?.id ?? "main-1",
      name: data.name,
      description: data.description,
      isMain: true,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    localStorage.setItem(MAIN_KEY, JSON.stringify(brand));
    return brand;
  },
  getSubs(): Brand[] {
    return loadSubs();
  },
  addSub(name: string, description: string): Brand {
    const list = loadSubs();
    const now = new Date().toISOString();
    const id = `sub-${Date.now()}`;
    const brand: Brand = { id, name, description, isMain: false, createdAt: now, updatedAt: now };
    list.push(brand);
    localStorage.setItem(SUBS_KEY, JSON.stringify(list));
    return brand;
  },
  updateSub(id: string, data: { name: string; description: string }): void {
    const list = loadSubs();
    const idx = list.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const now = new Date().toISOString();
    list[idx] = { ...list[idx], ...data, updatedAt: now };
    localStorage.setItem(SUBS_KEY, JSON.stringify(list));
  },
  deleteSub(id: string): void {
    const list = loadSubs().filter((b) => b.id !== id);
    localStorage.setItem(SUBS_KEY, JSON.stringify(list));
  },
};
