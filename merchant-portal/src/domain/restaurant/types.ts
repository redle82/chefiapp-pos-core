/**
 * Restaurant Domain Types
 *
 * Tipos finitos para o domínio de restaurante.
 * Sem dependências de React ou infraestrutura.
 */

/** Tipo de estabelecimento */
export type EstablishmentType =
  | "restaurant"
  | "bar"
  | "hotel"
  | "beach_club"
  | "cafe"
  | "other";

/** País suportado */
export type Country = "BR" | "ES" | "PT" | "US" | "GB" | "MX" | "CA" | "AU" | "IT" | "FR" | "DE";

/** Fuso horário suportado */
export type Timezone =
  | "America/Sao_Paulo"
  | "Europe/Madrid"
  | "Europe/Lisbon"
  | "America/New_York"
  | "Europe/London"
  | "America/Mexico_City"
  | "America/Toronto"
  | "Australia/Sydney"
  | "Europe/Rome"
  | "Europe/Paris"
  | "Europe/Berlin";

/** Moeda suportada */
export type Currency = "BRL" | "EUR" | "USD" | "GBP" | "MXN" | "CAD" | "AUD";

/** Locale suportado */
export type Locale =
  | "pt-BR"
  | "es-ES"
  | "en-US"
  | "pt-PT"
  | "en-GB"
  | "es-MX"
  | "en-CA"
  | "en-AU"
  | "it-IT"
  | "fr-FR"
  | "de-DE";

/** Dados do formulário de identidade */
export interface IdentityFormData {
  name: string;
  logoUrl?: string;
  type: EstablishmentType;
  country: Country;
  timezone: Timezone;
  currency: Currency;
  locale: Locale;
}

/** Zona do restaurante */
export type ZoneType = "BAR" | "SALON" | "KITCHEN" | "TERRACE";

/** Dados do formulário de localização */
export interface LocationFormData {
  address: string;
  city: string;
  postalCode: string;
  zones: ZoneType[];
  tableCount: number;
}

/** Resultado de validação */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/** Erro de validação */
export interface ValidationError {
  field: string;
  message: string;
}

/** Dia da semana */
export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

/** Horário de funcionamento */
export interface OperatingHours {
  day: DayOfWeek;
  open: string;
  close: string;
  closed: boolean;
}

/** Dados do formulário de horários */
export interface ScheduleFormData {
  hours: OperatingHours[];
  timezone: Timezone;
}
