/**
 * Store de Ubicaciones: mock em localStorage; depois trocar por Zustand/API.
 * Chave: chefiapp_locations / chefiapp_location_groups
 */

import type { Location, LocationGroup } from "../types";

const LOCATIONS_KEY = "chefiapp_locations";
const GROUPS_KEY = "chefiapp_location_groups";

function loadLocations(): Location[] {
  try {
    const raw = localStorage.getItem(LOCATIONS_KEY);
    if (!raw) return getDefaultLocations();
    const parsed = JSON.parse(raw) as Location[];
    return Array.isArray(parsed) ? parsed : getDefaultLocations();
  } catch {
    return getDefaultLocations();
  }
}

function getDefaultLocations(): Location[] {
  const now = new Date().toISOString();
  return [
    {
      id: "loc-1",
      name: "Sofia Gastrobar Ibiza",
      address: "Carrer des Caló, 109, 07829 Sant Josep de sa Talaia, Illes Balears, Spain",
      country: "ES",
      city: "Sant Josep de sa Talaia",
      postalCode: "07829",
      timezone: "Europe/Madrid",
      currency: "EUR",
      isActive: true,
      isPrimary: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function loadGroups(): LocationGroup[] {
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocationGroup[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocations(items: Location[]) {
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(items));
}

function saveGroups(items: LocationGroup[]) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(items));
}

export const locationsStore = {
  getLocations(): Location[] {
    return loadLocations();
  },

  getGroups(): LocationGroup[] {
    return loadGroups();
  },

  addLocation(loc: Omit<Location, "id" | "createdAt" | "updatedAt">): Location {
    const list = loadLocations();
    const now = new Date().toISOString();
    const id = `loc-${Date.now()}`;
    const isPrimary = list.length === 0;
    const newLoc: Location = {
      ...loc,
      id,
      isPrimary: loc.isPrimary ?? isPrimary,
      createdAt: now,
      updatedAt: now,
    };
    if (newLoc.isPrimary) {
      list.forEach((l) => {
        l.isPrimary = false;
        l.updatedAt = now;
      });
    }
    list.push(newLoc);
    saveLocations(list);
    return newLoc;
  },

  updateLocation(id: string, patch: Partial<Location>): Location | null {
    const list = loadLocations();
    const idx = list.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    if (patch.isPrimary === true) {
      list.forEach((l) => {
        l.isPrimary = l.id === id;
        l.updatedAt = now;
      });
    }
    list[idx] = { ...list[idx], ...patch, updatedAt: now };
    saveLocations(list);
    return list[idx];
  },

  deleteLocation(id: string): boolean {
    const list = loadLocations().filter((l) => l.id !== id);
    if (list.length === loadLocations().length) return false;
    saveLocations(list);
    const groups = loadGroups().map((g) => ({
      ...g,
      locationIds: g.locationIds.filter((lid) => lid !== id),
      updatedAt: new Date().toISOString(),
    }));
    saveGroups(groups);
    return true;
  },

  addGroup(name: string, locationIds: string[]): LocationGroup {
    const list = loadGroups();
    const now = new Date().toISOString();
    const id = `grp-${Date.now()}`;
    const newGrp: LocationGroup = { id, name, locationIds, createdAt: now, updatedAt: now };
    list.push(newGrp);
    saveGroups(list);
    return newGrp;
  },

  updateGroup(id: string, patch: { name?: string; locationIds?: string[] }): LocationGroup | null {
    const list = loadGroups();
    const idx = list.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    list[idx] = { ...list[idx], ...patch, updatedAt: now };
    saveGroups(list);
    return list[idx];
  },

  deleteGroup(id: string): boolean {
    const list = loadGroups().filter((g) => g.id !== id);
    if (list.length === loadGroups().length) return false;
    saveGroups(list);
    return true;
  },
};
