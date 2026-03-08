/**
 * Restaurant Identity Validation Functions
 *
 * Funções puras para validação de identidade do restaurante.
 * Sem dependências de React ou infraestrutura.
 */

import type {
  Country,
  Currency,
  EstablishmentType,
  IdentityFormData,
  Locale,
  Timezone,
  ValidationError,
  ValidationResult,
} from "./types";

/** Tipos de estabelecimento válidos */
export const VALID_ESTABLISHMENT_TYPES: EstablishmentType[] = [
  "restaurant",
  "bar",
  "hotel",
  "beach_club",
  "cafe",
  "other",
];

/** Países válidos */
export const VALID_COUNTRIES: Country[] = [
  "BR",
  "ES",
  "PT",
  "US",
  "GB",
  "MX",
  "CA",
  "AU",
];

/** Fusos horários válidos */
export const VALID_TIMEZONES: Timezone[] = [
  "America/Sao_Paulo",
  "Europe/Madrid",
  "Europe/Lisbon",
  "America/New_York",
  "Europe/London",
  "America/Mexico_City",
  "America/Toronto",
  "Australia/Sydney",
];

/** Moedas válidas */
export const VALID_CURRENCIES: Currency[] = [
  "BRL",
  "EUR",
  "USD",
  "GBP",
  "MXN",
  "CAD",
  "AUD",
];

/** Locales válidos */
export const VALID_LOCALES: Locale[] = [
  "pt-BR",
  "es-ES",
  "en-US",
  "pt-PT",
  "en-GB",
  "es-MX",
  "en-CA",
  "en-AU",
];

/**
 * Valida o nome do restaurante.
 *
 * @param name - Nome do restaurante
 * @returns Erro de validação ou null se válido
 */
export function validateName(name: string): ValidationError | null {
  if (!name || name.trim().length < 3) {
    return {
      field: "name",
      message: "Nome deve ter pelo menos 3 caracteres",
    };
  }
  if (name.trim().length > 100) {
    return {
      field: "name",
      message: "Nome deve ter no máximo 100 caracteres",
    };
  }
  return null;
}

/**
 * Valida URL do logo.
 *
 * @param logoUrl - URL do logo
 * @returns Erro de validação ou null se válido
 */
export function validateLogoUrl(
  logoUrl: string | undefined,
): ValidationError | null {
  if (!logoUrl) return null;
  try {
    new URL(logoUrl);
    return null;
  } catch {
    return {
      field: "logoUrl",
      message: "URL do logo inválida",
    };
  }
}

/**
 * Valida tipo de estabelecimento.
 *
 * @param type - Tipo de estabelecimento
 * @returns Erro de validação ou null se válido
 */
export function validateEstablishmentType(
  type: EstablishmentType,
): ValidationError | null {
  if (!VALID_ESTABLISHMENT_TYPES.includes(type)) {
    return {
      field: "type",
      message: "Tipo de estabelecimento inválido",
    };
  }
  return null;
}

/**
 * Valida país.
 *
 * @param country - País
 * @returns Erro de validação ou null se válido
 */
export function validateCountry(country: Country): ValidationError | null {
  if (!VALID_COUNTRIES.includes(country)) {
    return {
      field: "country",
      message: "País inválido",
    };
  }
  return null;
}

/**
 * Valida fuso horário.
 *
 * @param timezone - Fuso horário
 * @returns Erro de validação ou null se válido
 */
export function validateTimezone(timezone: Timezone): ValidationError | null {
  if (!VALID_TIMEZONES.includes(timezone)) {
    return {
      field: "timezone",
      message: "Fuso horário inválido",
    };
  }
  return null;
}

/**
 * Valida moeda.
 *
 * @param currency - Moeda
 * @returns Erro de validação ou null se válido
 */
export function validateCurrency(currency: Currency): ValidationError | null {
  if (!VALID_CURRENCIES.includes(currency)) {
    return {
      field: "currency",
      message: "Moeda inválida",
    };
  }
  return null;
}

/**
 * Valida locale.
 *
 * @param locale - Locale
 * @returns Erro de validação ou null se válido
 */
export function validateLocale(locale: Locale): ValidationError | null {
  if (!VALID_LOCALES.includes(locale)) {
    return {
      field: "locale",
      message: "Idioma inválido",
    };
  }
  return null;
}

/**
 * Valida todos os campos de identidade do restaurante.
 *
 * @param data - Dados do formulário de identidade
 * @returns Resultado da validação
 */
export function validateIdentity(data: IdentityFormData): ValidationResult {
  const errors: ValidationError[] = [];

  const nameError = validateName(data.name);
  if (nameError) errors.push(nameError);

  const logoError = validateLogoUrl(data.logoUrl);
  if (logoError) errors.push(logoError);

  const typeError = validateEstablishmentType(data.type);
  if (typeError) errors.push(typeError);

  const countryError = validateCountry(data.country);
  if (countryError) errors.push(countryError);

  const timezoneError = validateTimezone(data.timezone);
  if (timezoneError) errors.push(timezoneError);

  const currencyError = validateCurrency(data.currency);
  if (currencyError) errors.push(currencyError);

  const localeError = validateLocale(data.locale);
  if (localeError) errors.push(localeError);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Verifica se o formulário de identidade está completo.
 *
 * @param data - Dados do formulário de identidade
 * @returns true se todos os campos obrigatórios estão preenchidos
 */
export function isIdentityComplete(data: Partial<IdentityFormData>): boolean {
  return !!(
    data.name &&
    data.name.trim().length >= 3 &&
    data.type &&
    data.country &&
    data.timezone &&
    data.currency &&
    data.locale
  );
}
