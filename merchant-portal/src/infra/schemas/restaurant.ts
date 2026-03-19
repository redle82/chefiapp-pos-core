/**
 * Restaurant Schemas
 *
 * Schemas Zod para validação de dados do restaurante.
 */

import { z } from "zod";

/** Schema para tipo de estabelecimento */
export const EstablishmentTypeSchema = z.enum([
  "restaurant",
  "bar",
  "hotel",
  "beach_club",
  "cafe",
  "other",
]);

/** Schema para país */
export const CountrySchema = z.enum([
  "BR",
  "ES",
  "PT",
  "US",
  "GB",
  "MX",
  "CA",
  "AU",
  "IT",
  "FR",
  "DE",
]);

/** Schema para fuso horário */
export const TimezoneSchema = z.enum([
  "America/Sao_Paulo",
  "Europe/Madrid",
  "Europe/Lisbon",
  "America/New_York",
  "Europe/London",
  "America/Mexico_City",
  "America/Toronto",
  "Australia/Sydney",
  "Europe/Rome",
  "Europe/Paris",
  "Europe/Berlin",
]);

/** Schema para moeda */
export const CurrencySchema = z.enum([
  "BRL",
  "EUR",
  "USD",
  "GBP",
  "MXN",
  "CAD",
  "AUD",
]);

/** Schema para locale */
export const LocaleSchema = z.enum([
  "pt-BR",
  "es-ES",
  "en-US",
  "pt-PT",
  "en-GB",
  "es-MX",
  "en-CA",
  "en-AU",
  "it-IT",
  "fr-FR",
  "de-DE",
]);

/** Schema para zona do restaurante */
export const ZoneTypeSchema = z.enum(["BAR", "SALON", "KITCHEN", "TERRACE"]);

/** Schema para identidade do restaurante */
export const RestaurantIdentitySchema = z.object({
  name: z.string().min(3).max(100),
  logoUrl: z.string().url().optional().or(z.literal("")),
  type: EstablishmentTypeSchema,
  country: CountrySchema,
  timezone: TimezoneSchema,
  currency: CurrencySchema,
  locale: LocaleSchema,
});

/** Schema para localização do restaurante */
export const RestaurantLocationSchema = z.object({
  address: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().min(4),
  zones: z.array(ZoneTypeSchema).min(1),
  tableCount: z.number().int().min(0).max(500),
});

/** Schema para dia da semana */
export const DayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

/** Schema para horário de funcionamento */
export const OperatingHoursSchema = z.object({
  day: DayOfWeekSchema,
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
  closed: z.boolean(),
});

/** Schema para horários do restaurante */
export const RestaurantScheduleSchema = z.object({
  hours: z.array(OperatingHoursSchema).length(7),
  timezone: TimezoneSchema,
});

/** Tipos inferidos dos schemas */
export type EstablishmentType = z.infer<typeof EstablishmentTypeSchema>;
export type Country = z.infer<typeof CountrySchema>;
export type Timezone = z.infer<typeof TimezoneSchema>;
export type Currency = z.infer<typeof CurrencySchema>;
export type Locale = z.infer<typeof LocaleSchema>;
export type ZoneType = z.infer<typeof ZoneTypeSchema>;
export type RestaurantIdentity = z.infer<typeof RestaurantIdentitySchema>;
export type RestaurantLocation = z.infer<typeof RestaurantLocationSchema>;
export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;
export type OperatingHours = z.infer<typeof OperatingHoursSchema>;
export type RestaurantSchedule = z.infer<typeof RestaurantScheduleSchema>;
