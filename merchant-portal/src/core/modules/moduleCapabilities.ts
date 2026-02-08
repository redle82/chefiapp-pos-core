/**
 * moduleCapabilities - Contrato único de capacidades de módulo.
 *
 * Este arquivo responde perguntas como:
 * - este módulo está instalado?
 * - ele deve aparecer como locked?
 * - para onde o usuário deve ser levado ao clicar?
 *
 * Fonte de verdade:
 * - runtime.installed_modules (ids de módulo)
 * - contrato de rotas do frontend
 */

export type ModulePhase = "active" | "pilot" | "evolving";

export interface ModuleCapability {
  id: string;
  installed: boolean;
  locked: boolean;
  status: "installed" | "not_installed";
  /** Fase de produto em que o módulo está */
  phase: ModulePhase;
  /** Rota principal de entrada quando instalado */
  primaryRoute: string;
  /** Rota a usar quando clicado no Dashboard */
  entryRoute: string;
}

// Mapa canônico de rotas + fase de produto por módulo.
// IMPORTANTE: manter em sincronia com o Dashboard e com o Router.
const MODULE_DEFINITIONS: Record<
  string,
  {
    primaryRoute: string;
    phase: ModulePhase;
  }
> = {
  // Núcleo operacional pronto para piloto
  tpv: { primaryRoute: "/op/tpv", phase: "pilot" },
  kds: { primaryRoute: "/op/kds", phase: "pilot" },
  menu: { primaryRoute: "/menu-builder", phase: "pilot" },
  "restaurant-web": { primaryRoute: "/public/demo-restaurant", phase: "pilot" },

  // Em uso hoje (núcleo já dominado na operação)
  tasks: { primaryRoute: "/tasks", phase: "active" },
  appstaff: { primaryRoute: "/garcom", phase: "active" },
  health: { primaryRoute: "/health", phase: "active" },
  alerts: { primaryRoute: "/alerts", phase: "active" },
  "system-tree": { primaryRoute: "/system-tree", phase: "active" },
  config: { primaryRoute: "/config", phase: "active" },

  // Em evolução (visível, mas ainda roadmap)
  people: { primaryRoute: "/people", phase: "evolving" },
  mentor: { primaryRoute: "/mentor", phase: "evolving" },
  purchases: { primaryRoute: "/purchases", phase: "evolving" },
  financial: { primaryRoute: "/financial", phase: "evolving" },
  reservations: { primaryRoute: "/reservations", phase: "evolving" },
  groups: { primaryRoute: "/groups", phase: "evolving" },
};

export function getModuleCapability(
  moduleId: string | undefined,
  installedModules: string[],
): ModuleCapability | null {
  if (!moduleId) return null;

  const definition = MODULE_DEFINITIONS[moduleId];
  if (!definition) {
    return {
      id: moduleId,
      installed: installedModules.includes(moduleId),
      locked: false,
      status: installedModules.includes(moduleId)
        ? "installed"
        : "not_installed",
      phase: "evolving",
      primaryRoute: "/",
      entryRoute: "/system-tree",
    };
  }

  const installed = installedModules.includes(moduleId);
  const primaryRoute = definition.primaryRoute;

  return {
    id: moduleId,
    installed,
    locked: !installed,
    status: installed ? "installed" : "not_installed",
    phase: definition.phase,
    primaryRoute,
    entryRoute: installed ? primaryRoute : "/system-tree",
  };
}
