/**
 * Store de Entidades Legais: mock em localStorage; depois trocar por API.
 * Fase 1: 1 entidade legal, associada a todas as ubicaciones.
 */
// @ts-nocheck


import type {
  LegalEntity,
  LegalEntityUsage,
  LocationEntityAssignment,
  LegalFiscalExtras,
} from "../types";

const ENTITY_KEY = "chefiapp_legal_entity";
const USAGE_KEY = "chefiapp_legal_entity_usage";
const ASSIGNMENTS_KEY = "chefiapp_legal_entity_assignments";
const EXTRAS_KEY = "chefiapp_legal_fiscal_extras";

const DEFAULT_ENTITY_ID = "entity-1";

function loadEntity(): LegalEntity | null {
  try {
    const raw = localStorage.getItem(ENTITY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LegalEntity;
  } catch {
    return null;
  }
}

function loadUsage(): LegalEntityUsage {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return defaultUsage();
    return JSON.parse(raw) as LegalEntityUsage;
  } catch {
    return defaultUsage();
  }
}

function defaultUsage(): LegalEntityUsage {
  return {
    useForBilling: true,
    useForReceipts: true,
    useForFiscalReports: true,
  };
}

function loadAssignments(): LocationEntityAssignment[] {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocationEntityAssignment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadExtras(): LegalFiscalExtras {
  try {
    const raw = localStorage.getItem(EXTRAS_KEY);
    if (!raw) return defaultExtras();
    return JSON.parse(raw) as LegalFiscalExtras;
  } catch {
    return defaultExtras();
  }
}

function defaultExtras(): LegalFiscalExtras {
  return {
    defaultFiscalFooter: "",
    legalReference: "",
    internalNotes: "",
  };
}

export const legalEntitiesStore = {
  getEntity(): LegalEntity | null {
    return loadEntity();
  },

  saveEntity(data: Omit<LegalEntity, "id" | "createdAt" | "updatedAt">): LegalEntity {
    const now = new Date().toISOString();
    const existing = loadEntity();
    const entity: LegalEntity = {
      id: existing?.id ?? DEFAULT_ENTITY_ID,
      ...data,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    localStorage.setItem(ENTITY_KEY, JSON.stringify(entity));
    return entity;
  },

  getUsage(): LegalEntityUsage {
    return loadUsage();
  },

  saveUsage(usage: LegalEntityUsage): void {
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  },

  getAssignments(): LocationEntityAssignment[] {
    return loadAssignments();
  },

  /** Fase 1: associa todas as ubicaciones à entidade principal. */
  setAssignment(locationId: string, entityId: string): void {
    const list = loadAssignments().filter((a) => a.locationId !== locationId);
    list.push({ locationId, entityId });
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(list));
  },

  getEntityIdForLocation(locationId: string): string | null {
    const list = loadAssignments();
    const a = list.find((x) => x.locationId === locationId);
    return a?.entityId ?? null;
  },

  getExtras(): LegalFiscalExtras {
    return loadExtras();
  },

  saveExtras(extras: LegalFiscalExtras): void {
    localStorage.setItem(EXTRAS_KEY, JSON.stringify(extras));
  },
};
