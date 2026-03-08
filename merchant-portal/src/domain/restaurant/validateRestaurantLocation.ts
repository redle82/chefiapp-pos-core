/**
 * Restaurant Location Validation Functions
 *
 * Funções puras para validação de localização do restaurante.
 * Sem dependências de React ou infraestrutura.
 */

import type {
  LocationFormData,
  ValidationError,
  ValidationResult,
  ZoneType,
} from "./types";

/** Zonas válidas */
export const VALID_ZONES: ZoneType[] = ["BAR", "SALON", "KITCHEN", "TERRACE"];

/**
 * Valida endereço.
 *
 * @param address - Endereço
 * @returns Erro de validação ou null se válido
 */
export function validateAddress(address: string): ValidationError | null {
  if (!address || address.trim().length < 5) {
    return {
      field: "address",
      message: "Endereço deve ter pelo menos 5 caracteres",
    };
  }
  return null;
}

/**
 * Valida cidade.
 *
 * @param city - Cidade
 * @returns Erro de validação ou null se válido
 */
export function validateCity(city: string): ValidationError | null {
  if (!city || city.trim().length < 2) {
    return {
      field: "city",
      message: "Cidade deve ter pelo menos 2 caracteres",
    };
  }
  return null;
}

/**
 * Valida código postal.
 *
 * @param postalCode - Código postal
 * @returns Erro de validação ou null se válido
 */
export function validatePostalCode(postalCode: string): ValidationError | null {
  if (!postalCode || postalCode.trim().length < 4) {
    return {
      field: "postalCode",
      message: "Código postal inválido",
    };
  }
  return null;
}

/**
 * Valida zonas do restaurante.
 *
 * @param zones - Lista de zonas
 * @returns Erro de validação ou null se válido
 */
export function validateZones(zones: ZoneType[]): ValidationError | null {
  if (!zones || zones.length === 0) {
    return {
      field: "zones",
      message: "Selecione pelo menos uma zona",
    };
  }
  const invalidZones = zones.filter((z) => !VALID_ZONES.includes(z));
  if (invalidZones.length > 0) {
    return {
      field: "zones",
      message: `Zonas inválidas: ${invalidZones.join(", ")}`,
    };
  }
  return null;
}

/**
 * Valida número de mesas.
 *
 * @param tableCount - Número de mesas
 * @returns Erro de validação ou null se válido
 */
export function validateTableCount(tableCount: number): ValidationError | null {
  if (tableCount < 0) {
    return {
      field: "tableCount",
      message: "Número de mesas não pode ser negativo",
    };
  }
  if (tableCount > 500) {
    return {
      field: "tableCount",
      message: "Número de mesas muito alto",
    };
  }
  return null;
}

/**
 * Valida todos os campos de localização do restaurante.
 *
 * @param data - Dados do formulário de localização
 * @returns Resultado da validação
 */
export function validateLocation(data: LocationFormData): ValidationResult {
  const errors: ValidationError[] = [];

  const addressError = validateAddress(data.address);
  if (addressError) errors.push(addressError);

  const cityError = validateCity(data.city);
  if (cityError) errors.push(cityError);

  const postalCodeError = validatePostalCode(data.postalCode);
  if (postalCodeError) errors.push(postalCodeError);

  const zonesError = validateZones(data.zones);
  if (zonesError) errors.push(zonesError);

  const tableCountError = validateTableCount(data.tableCount);
  if (tableCountError) errors.push(tableCountError);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Verifica se o formulário de localização está completo.
 *
 * @param data - Dados do formulário de localização
 * @returns true se todos os campos obrigatórios estão preenchidos
 */
export function isLocationComplete(data: Partial<LocationFormData>): boolean {
  return !!(
    data.address &&
    data.address.trim().length >= 5 &&
    data.city &&
    data.city.trim().length >= 2 &&
    data.postalCode &&
    data.zones &&
    data.zones.length > 0
  );
}
