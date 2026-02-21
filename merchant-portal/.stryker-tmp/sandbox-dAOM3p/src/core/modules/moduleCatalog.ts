/**
 * moduleCatalog — SSOT de módulos do ChefIApp OS
 *
 * Define:
 * - ALL_KNOWN_MODULES: tudo que existe no System Tree (instalável ou declarado)
 * - ALL_SAFE_MODULES_DEV: subconjunto seguro para DEV_STABLE (não chama RPC inexistente, não exige auth real)
 * - ALL_SAFE_MODULES_PILOT: subconjunto seguro para piloto (backends Core prontos ou mock coerente)
 *
 * Política Premium:
 * - installed_modules = ALL_KNOWN_MODULES quando plan === 'premium' ou DEV_STABLE_MODE ON
 * - active_modules = ALL_SAFE_MODULES_DEV no DEV_STABLE (só o que pode rodar sem quebrar)
 */
// @ts-nocheck


export type DataSource = "mock" | "core";
export type ModuleCapabilityMode = "trial" | "pilot" | "prod" | "evolving";

export interface ModuleCapabilityEntry {
  dataSource: DataSource;
  offline: boolean;
  mode?: ModuleCapabilityMode;
}

/** Todos os módulos existentes no System Tree / Dashboard (ids canônicos) */
export const ALL_KNOWN_MODULES: string[] = [
  // Núcleo operacional (já em uso)
  "tasks",
  "appstaff",
  "health",
  "alerts",
  "system-tree",
  "config",
  "dashboard",
  // Interface pública e piloto
  "restaurant-web",
  "tpv",
  "kds",
  "menu",
  // Em evolução / roadmap
  "people",
  "mentor",
  "purchases",
  "financial",
  "reservations",
  "groups",
  "bank_hours",
  "stock_automation",
  // Extras da árvore (virtual / submódulos se necessário)
  "inventory-stock",
  "shopping-list",
  "operacao",
];

/**
 * Módulos seguros para DEV_STABLE: não chamam supabase.rpc nem exigem auth real.
 * Engines usam TaskReader/HealthEngine/dockerCoreClient ou mock.
 */
export const ALL_SAFE_MODULES_DEV: string[] = [
  "tasks",
  "health",
  "alerts",
  "system-tree",
  "config",
  "dashboard",
  "restaurant-web",
  "appstaff",
  "tpv",
  "kds",
  "menu",
  "operacao",
  "inventory-stock",
  "shopping-list",
];

/**
 * Módulos seguros para piloto: backends Core prontos ou fallback mock coerente.
 * Inclui tudo do DEV + módulos que já têm integração Core estável.
 */
export const ALL_SAFE_MODULES_PILOT: string[] = [
  ...ALL_SAFE_MODULES_DEV,
  "people",
  "purchases",
  "financial",
  "reservations",
  "groups",
];

/** Capabilities por módulo: dataSource e offline (default para DEV = mock quando não definido) */
export const MODULE_CAPABILITIES_DEFAULT: Record<
  string,
  ModuleCapabilityEntry
> = {
  tasks: { dataSource: "core", offline: false, mode: "prod" },
  health: { dataSource: "core", offline: false, mode: "prod" },
  alerts: { dataSource: "mock", offline: true, mode: "pilot" },
  "system-tree": { dataSource: "mock", offline: true, mode: "prod" },
  config: { dataSource: "mock", offline: true, mode: "pilot" },
  dashboard: { dataSource: "mock", offline: true, mode: "prod" },
  "restaurant-web": { dataSource: "core", offline: false, mode: "pilot" },
  appstaff: { dataSource: "mock", offline: true, mode: "pilot" },
  tpv: { dataSource: "core", offline: false, mode: "pilot" },
  kds: { dataSource: "core", offline: false, mode: "pilot" },
  menu: { dataSource: "core", offline: false, mode: "pilot" },
  operacao: { dataSource: "mock", offline: true, mode: "pilot" },
  "inventory-stock": { dataSource: "mock", offline: true, mode: "pilot" },
  "shopping-list": { dataSource: "mock", offline: true, mode: "pilot" },
  people: { dataSource: "mock", offline: true, mode: "evolving" },
  mentor: { dataSource: "mock", offline: true, mode: "evolving" },
  purchases: { dataSource: "mock", offline: true, mode: "evolving" },
  financial: { dataSource: "core", offline: true, mode: "pilot" },
  reservations: { dataSource: "core", offline: true, mode: "pilot" },
  groups: { dataSource: "core", offline: false, mode: "pilot" },
  bank_hours: { dataSource: "mock", offline: true, mode: "evolving" },
  stock_automation: { dataSource: "mock", offline: true, mode: "evolving" },
};

export function getModuleCapabilityEntry(
  moduleId: string,
): ModuleCapabilityEntry {
  return (
    MODULE_CAPABILITIES_DEFAULT[moduleId] ?? {
      dataSource: "mock" as DataSource,
      offline: true,
      mode: "evolving",
    }
  );
}

export function isModuleSafeForDev(moduleId: string): boolean {
  return ALL_SAFE_MODULES_DEV.includes(moduleId);
}

export function isModuleSafeForPilot(moduleId: string): boolean {
  return ALL_SAFE_MODULES_PILOT.includes(moduleId);
}
