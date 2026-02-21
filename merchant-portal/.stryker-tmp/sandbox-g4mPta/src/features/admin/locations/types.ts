/**
 * Tipos para Ubicaciones / Locais (cadastro de unidades).
 * Ref: Last.app Ubicaciones — tudo no sistema acontece dentro de uma Ubicación.
 */

export interface Location {
  id: string;
  name: string;
  address: string;
  country: string;
  city: string;
  postalCode: string;
  timezone: string; // IANA, ex: Europe/Madrid
  currency: string; // EUR default
  isActive: boolean;
  isPrimary?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationGroup {
  id: string;
  name: string;
  locationIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type LocationForm = Omit<Location, "id" | "createdAt" | "updatedAt">;
export type GroupForm = Pick<LocationGroup, "name"> & { locationIds: string[] };
