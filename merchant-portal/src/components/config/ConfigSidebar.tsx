/**
 * ConfigSidebar - Sidebar Fixa do Config Tree
 *
 * Árvore de configuração persistente, acessível após publicação.
 * Visual: Restaurant OS Design System (core-design-system tokens).
 * MENU_OPERATIONAL_STATE: indicador do MenuState (ícone + label curto).
 */

import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  space,
} from "@chefiapp/core-design-system";
import { useLocation, useNavigate } from "react-router-dom";
import { MENU_STATE_MESSAGES, useMenuState } from "../../core/menu/MenuState";
import {
  canAccessPath,
  getConfigCopy,
  normalizePath,
  useRoleOptional,
} from "../../core/roles";
import { ConfigItem } from "./ConfigItem";
import type {
  ConfigSection,
  ConfigSectionConfig,
  ConfigSectionGroup,
} from "./types";

// Re-export types for convenience
export type { ConfigSection, ConfigSectionConfig };

const SECTIONS: ConfigSectionConfig[] = [
  {
    id: "general",
    label: "Geral",
    icon: "🏢",
    description:
      "Visão geral e atalhos para identidade, idioma, recibo e integrações",
    path: "/config/general",
    group: "Basics",
  },
  {
    id: "ubicaciones",
    label: "Locais",
    icon: "📍",
    description: "Locais operacionais, mesas, zonas",
    path: "/admin/config/locations",
    group: "Basics",
  },
  {
    id: "identity",
    label: "Identidade",
    icon: "🏢",
    description: "Nome, tipo, país",
    path: "/config/identity",
    group: "Basics",
  },
  {
    id: "location",
    label: "Localização",
    icon: "📍",
    description: "Endereço, mesas, zonas",
    path: "/config/location",
    group: "Basics",
    children: [
      {
        id: "location" as ConfigSection,
        label: "Endereço",
        icon: "📍",
        path: "/config/location/address",
      },
      {
        id: "location" as ConfigSection,
        label: "Mesas & Zonas",
        icon: "🪑",
        path: "/config/location/tables",
      },
    ],
  },
  {
    id: "schedule",
    label: "Tempo",
    icon: "⏰",
    description: "Horários e turnos",
    path: "/config/schedule",
    group: "Operação",
    children: [
      {
        id: "schedule" as ConfigSection,
        label: "Horários",
        icon: "⏰",
        path: "/config/schedule/hours",
      },
      {
        id: "schedule" as ConfigSection,
        label: "Turnos",
        icon: "📅",
        path: "/manager/schedule",
      },
    ],
  },
  {
    id: "menu",
    label: "Cardápio",
    icon: "🍽️",
    description: "Produtos e receitas",
    path: "/menu-builder",
    group: "Operação",
  },
  {
    id: "inventory",
    label: "Estoque",
    icon: "📦",
    description: "Ingredientes e quantidades",
    path: "/inventory-stock",
    group: "Operação",
    children: [
      {
        id: "inventory" as ConfigSection,
        label: "Ingredientes",
        icon: "🥕",
        path: "/inventory-stock",
      },
      {
        id: "inventory" as ConfigSection,
        label: "Alertas",
        icon: "⚠️",
        path: "/inventory-stock?tab=alerts",
      },
    ],
  },
  {
    id: "people",
    label: "Pessoas",
    icon: "👥",
    description: "Funcionários e papéis",
    path: "/config/people",
    group: "Operação",
    children: [
      {
        id: "people" as ConfigSection,
        label: "Funcionários",
        icon: "👤",
        path: "/config/people/employees",
      },
      {
        id: "people" as ConfigSection,
        label: "Papéis",
        icon: "🎭",
        path: "/config/people/roles",
      },
      {
        id: "people" as ConfigSection,
        label: "Escalas",
        icon: "📋",
        path: "/manager/schedule",
      },
    ],
  },
  {
    id: "payments",
    label: "Pagamentos",
    icon: "💳",
    description: "Métodos de pagamento",
    path: "/config/payments",
    group: "Comercial",
  },
  {
    id: "billing",
    label: "Faturação",
    icon: "📋",
    description: "Plano e assinatura",
    path: "/app/billing",
    group: "Comercial",
  },
  {
    id: "publish",
    label: "Publicar restaurante",
    icon: "🚀",
    description: "Ativar TPV, KDS e presença online",
    path: "/app/publish",
    group: "Publicação",
  },
  {
    id: "install",
    label: "Instalar TPV / KDS",
    icon: "📲",
    description: "Web app instalável (Caixa e Cozinha)",
    path: "/admin/modules",
    group: "Publicação",
  },
  {
    id: "integrations",
    label: "Integrações",
    icon: "🔌",
    description: "Ligue TPV, delivery e outros serviços",
    path: "/config/integrations",
    group: "Avançado",
  },
  {
    id: "modules",
    label: "Módulos",
    icon: "🧩",
    description: "Instale e gerencie módulos",
    path: "/config/modules",
    group: "Avançado",
  },
  {
    id: "perception",
    label: "Percepção",
    icon: "📷",
    description: "Câmera + análise com IA",
    path: "/config/perception",
    group: "Avançado",
  },
  {
    id: "status",
    label: "Estado",
    icon: "🚀",
    description: "Publicação e status",
    path: "/config/status",
    group: "Avançado",
  },
  {
    id: "data-privacy",
    label: "Dados e privacidade",
    icon: "🔒",
    description: "Exportar dados ou eliminar conta (RGPD)",
    path: "/config/data-privacy",
    group: "Outros",
  },
  {
    id: "entender-sistema",
    label: "Entender o sistema",
    icon: "🧭",
    description: "Como tudo se conecta",
    path: "/auth",
    group: "Outros",
  },
];

function filterSectionsByRole(
  sections: ConfigSectionConfig[],
  role: "owner" | "manager" | "staff" | null,
): ConfigSectionConfig[] {
  if (!role) return sections;
  return sections
    .map((section) => {
      const sectionAllowed = canAccessPath(role, normalizePath(section.path));
      const filteredChildren = section.children?.filter((child) =>
        canAccessPath(role, normalizePath(child.path)),
      );
      const hasAllowedChildren =
        filteredChildren && filteredChildren.length > 0;
      if (!sectionAllowed && !hasAllowedChildren) return null;
      return {
        ...section,
        children:
          filteredChildren && filteredChildren.length > 0
            ? filteredChildren
            : section.children,
      };
    })
    .filter((s): s is ConfigSectionConfig => s !== null);
}

const MENU_STATE_ICON: Record<string, string> = {
  LIVE: "🟢",
  VALID_UNPUBLISHED: "🟡",
  INCOMPLETE: "🟠",
  EMPTY: "⚪",
};

/** Ordem dos grupos na sidebar (CONFIG_WEB_UX). */
const GROUP_ORDER: ConfigSectionGroup[] = [
  "Basics",
  "Operação",
  "Comercial",
  "Publicação",
  "Avançado",
  "Outros",
];

function sectionsByGroup(
  sections: ConfigSectionConfig[],
): Map<ConfigSectionGroup | "", ConfigSectionConfig[]> {
  const map = new Map<ConfigSectionGroup | "", ConfigSectionConfig[]>();
  for (const section of sections) {
    const g = section.group ?? "";
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(section);
  }
  return map;
}

export function ConfigSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const roleContext = useRoleOptional();
  const role = roleContext?.role ?? null;
  const configCopy = getConfigCopy(role);
  const sections = filterSectionsByRole(SECTIONS, role);
  const menuState = useMenuState();

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const handleClick = (section: ConfigSectionConfig) => {
    navigate(section.path);
  };

  return (
    <div
      style={{
        width: "280px",
        height: "100vh",
        backgroundColor: colors.background,
        borderRight: `1px solid ${colors.border}`,
        padding: `${space.lg}px 0`,
        overflowY: "auto",
        position: "fixed",
        left: 0,
        top: 0,
        fontFamily: fontFamily.sans,
      }}
    >
      <div
        style={{
          padding: `0 ${space.lg}px ${space.lg}px`,
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: space[4],
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: `${fontSize.xl}px`,
            fontWeight: fontWeight.bold,
            color: colors.textPrimary,
          }}
        >
          {configCopy.title}
        </h2>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: `${fontSize.sm}px`,
            color: colors.textSecondary,
          }}
        >
          {configCopy.subtitle}
        </p>
        {/* MENU_OPERATIONAL_STATE: indicador do menu (ícone + label curto). */}
        <div
          style={{
            marginTop: space[3],
            padding: `${space[2]}px ${space[3]}px`,
            borderRadius: 6,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            fontSize: `${fontSize.xs}px`,
            fontWeight: fontWeight.medium,
            color: colors.textSecondary,
          }}
        >
          <span style={{ marginRight: 6 }}>
            {MENU_STATE_ICON[menuState] ?? "⚪"}
          </span>
          {MENU_STATE_MESSAGES[menuState].short}
        </div>
      </div>

      {/* Seções agrupadas (CONFIG_WEB_UX) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: space[1],
          padding: `0 ${space[3]}px`,
        }}
      >
        {(() => {
          const byGroup = sectionsByGroup(sections);
          const orderedGroups = [
            ...GROUP_ORDER.filter(
              (g) => byGroup.has(g) && (byGroup.get(g)?.length ?? 0) > 0,
            ),
            ...(byGroup.has("") ? ["" as const] : []),
          ];
          return orderedGroups.map((groupKey) => {
            const groupSections = byGroup.get(groupKey) ?? [];
            if (groupSections.length === 0) return null;
            return (
              <div
                key={groupKey || "_ungrouped"}
                style={{ marginBottom: space[3] }}
              >
                {groupKey && (
                  <div
                    style={{
                      fontSize: `${fontSize.xs}px`,
                      fontWeight: fontWeight.semibold,
                      color: colors.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      padding: `${space[2]}px 0 ${space[1]}px`,
                      borderBottom: `1px solid ${colors.border}`,
                      marginBottom: space[2],
                    }}
                  >
                    {groupKey}
                  </div>
                )}
                {groupSections.map((section) => {
                  const active = isActive(section.path);
                  const hasChildren =
                    section.children && section.children.length > 0;

                  return (
                    <div key={section.id}>
                      <ConfigItem
                        config={section}
                        isActive={active}
                        onClick={() => handleClick(section)}
                      />
                      {hasChildren && active && (
                        <div
                          style={{
                            paddingLeft: `${space[5]}px`,
                            marginTop: space[1],
                          }}
                        >
                          {section.children!.map((child) => (
                            <ConfigItem
                              key={child.path}
                              config={child}
                              isActive={isActive(child.path)}
                              onClick={() => handleClick(child)}
                              isChild
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
