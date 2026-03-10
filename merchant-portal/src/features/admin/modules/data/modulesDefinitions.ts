/**
 * Catálogo estático dos módulos (Hub Módulos).
 * O status (active | needs_setup | inactive) é derivado em runtime a partir de
 * RestaurantRuntimeContext (installed_modules, active_modules).
 * Ref: plano página_mis_productos_módulos.
 */

import type { Module, ModuleStatus } from "../types";

export interface ModuleDefinition extends Omit<Module, "status"> {
  /** Status é derivado em runtime; valor por defeito para fallback. */
  defaultStatus?: ModuleStatus;
}

export const MODULES_DEFINITIONS: ModuleDefinition[] = [
  {
    id: "tpv",
    name: "Software TPV",
    description:
      "Gestiona tu Sala, pedidos de Delivery y Take away en un mismo sitio.",
    icon: "🖥️",
    primaryAction: "Open",
    secondaryAction: "Desactivar",
    block: "essenciais",
    defaultStatus: "active",
  },
  {
    id: "appstaff",
    name: "AppStaff",
    description:
      "App para a equipa: fichagem, tarefas, KDS, alertas e gestão de turno — tudo num só lugar.",
    icon: "📋",
    primaryAction: "Open",
    secondaryAction: "Desactivar",
    block: "essenciais",
    defaultStatus: "active",
  },
  {
    id: "fichaje",
    name: "Sistema de fichaje",
    description:
      "Simplifica el control horario de tu equipo. Los empleados pueden fichar entrada y salida en el TPV.",
    icon: "👥",
    primaryAction: "Activate",
    block: "essenciais",
    defaultStatus: "inactive",
  },
  {
    id: "stock",
    name: "Stock",
    description:
      "Gestiona tu inventario. Seguimiento de niveles, notificaciones de stock bajo e informes desde el TPV.",
    icon: "📦",
    primaryAction: "Activate",
    block: "essenciais",
    defaultStatus: "inactive",
  },
  {
    id: "tienda-online",
    name: "Página web",
    description:
      "A página web do restaurante: menu online, pedidos, QR codes e presença pública.",
    icon: "🌐",
    primaryAction: "Configure",
    secondaryAction: "Desactivar",
    block: "canais",
    defaultStatus: "active",
  },
  {
    id: "qr-ordering",
    name: "QR ORDERING",
    description:
      "Combina lo mejor de la carta digital con toda la tecnología de un e-commerce.",
    icon: "📱",
    primaryAction: "Configure",
    secondaryAction: "Desactivar",
    dependencies: ["Catálogo"],
    block: "canais",
    defaultStatus: "active",
  },
  {
    id: "reservas",
    name: "Reservas",
    description:
      "Consigue más reservas a través de tu página web, redes sociales y teléfono.",
    icon: "📅",
    primaryAction: "Configure",
    secondaryAction: "Desactivar",
    block: "canais",
    defaultStatus: "active",
  },
  {
    id: "delivery-integrator",
    name: "Integrador de delivery",
    description:
      "Integra tus canales de delivery y recibe todos los pedidos en un mismo lugar.",
    icon: "🚚",
    primaryAction: "Configure",
    secondaryAction: "Desactivar",
    dependencies: ["Integraciones"],
    block: "canais",
    defaultStatus: "active",
  },
];

export function deriveModuleStatus(
  moduleId: string,
  installed: string[],
  active: string[],
): ModuleStatus {
  const id = moduleId.toLowerCase();
  if (active.includes(id)) return "active";
  if (installed.includes(id)) return "needs_setup";
  return "inactive";
}

export function buildModulesFromRuntime(
  installed: string[],
  active: string[],
): Module[] {
  return MODULES_DEFINITIONS.map((def) => {
    const { defaultStatus: _unused, ...rest } = def;
    return {
      ...rest,
      status: deriveModuleStatus(def.id, installed, active),
    };
  }) as Module[];
}
