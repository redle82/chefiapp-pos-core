/**
 * AdminSidebar — Strategic hierarchy for the Admin "Comando Central".
 *
 * Mental model del dueño de restaurante:
 *   💰 Finanzas  →  🍽 Operación  →  👥 Clientes  →  📦 Producto  →  📊 Inteligencia  →  ⚙️ Sistema
 *
 * Config view (/admin/config/*) keeps its own flat list.
 */
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import { ChefIAppSignature } from "../../../../ui/design-system/sovereign/ChefIAppSignature";
import { RestaurantHeader } from "../../../../ui/design-system/sovereign/RestaurantHeader";
import type { ModuleStatus } from "../../modules/types";
import { useConfigModuleStates } from "../hooks/useConfigModuleStates";
import { useSidebarBanner } from "../hooks/useSidebarBanner";
import styles from "./AdminSidebar.module.css";
import { SidebarContextBanner } from "./SidebarContextBanner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SidebarLeaf = { labelKey: string; to: string };
type SidebarGroup = {
  id: string;
  titleKey: string;
  icon: string;
  items: SidebarLeaf[];
};

/* ------------------------------------------------------------------ */
/*  Strategic nav tree — what the restaurant owner thinks about        */
/* ------------------------------------------------------------------ */

const NAV_GROUPS: SidebarGroup[] = [
  {
    id: "finanzas",
    titleKey: "groups.financas",
    icon: "💰",
    items: [
      { labelKey: "items.transacoes", to: "/admin/payments" },
      { labelKey: "items.reembolsos", to: "/admin/payments/refunds" },
      { labelKey: "items.fechamentos", to: "/admin/closures" },
    ],
  },
  {
    id: "operacion",
    titleKey: "groups.operacao",
    icon: "🍽",
    items: [
      { labelKey: "items.reservas", to: "/admin/reservations" },
      { labelKey: "items.promocoes", to: "/admin/promotions" },
    ],
  },
  {
    id: "clientes",
    titleKey: "groups.clientes",
    icon: "👥",
    items: [{ labelKey: "items.diretorio", to: "/admin/customers" }],
  },
  {
    id: "producto",
    titleKey: "groups.produto",
    icon: "📦",
    items: [{ labelKey: "items.catalogo", to: "/admin/catalog" }],
  },
  {
    id: "inteligencia",
    titleKey: "groups.inteligencia",
    icon: "📊",
    items: [{ labelKey: "items.relatorios", to: "/admin/reports" }],
  },
  {
    id: "sistema",
    titleKey: "groups.sistema",
    icon: "⚙️",
    items: [
      { labelKey: "items.configuracao", to: "/admin/config" },
      { labelKey: "items.dispositivos", to: "/admin/devices" },
      { labelKey: "items.modulos", to: "/admin/modules" },
      { labelKey: "items.observabilidade", to: "/admin/observability" },
    ],
  },
];

/** Config sub-page items grouped by business domain */
type ConfigItem = { path: string; labelKey: string; to?: string };
type ConfigSection = { sectionKey: string; items: ConfigItem[] };

const CONFIG_SECTIONS: ConfigSection[] = [
  {
    sectionKey: "configSections.identity",
    items: [
      { path: "general", labelKey: "config.general" },
      { path: "locations", labelKey: "config.locations" },
      { path: "legal-entities", labelKey: "config.legalEntities" },
      { path: "brands", labelKey: "config.brands" },
    ],
  },
  {
    sectionKey: "configSections.plan",
    items: [{ path: "subscription", labelKey: "config.subscription" }],
  },
  {
    sectionKey: "configSections.operations",
    items: [
      { path: "website", labelKey: "config.website" },
      { path: "reservations", labelKey: "config.reservations" },
      { path: "pos-software", labelKey: "config.posSoftware" },
    ],
  },
  {
    sectionKey: "configSections.team",
    items: [
      { path: "users", labelKey: "config.adminUsers" },
      { path: "employees", labelKey: "config.employees" },
    ],
  },
  {
    sectionKey: "configSections.infrastructure",
    items: [
      { path: "devices", labelKey: "config.deviceManagement" },
      { path: "printers", labelKey: "config.printers" },
    ],
  },
  {
    sectionKey: "configSections.channels",
    items: [
      {
        path: "integraciones",
        labelKey: "config.integrations",
        to: "/admin/config/integrations",
      },
      { path: "delivery", labelKey: "config.delivery" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Check if any item in a group matches the current pathname. */
function isGroupActive(group: SidebarGroup, pathname: string): boolean {
  return group.items.some((item) => pathname.startsWith(item.to));
}

/** Derive initially open sections from the current url. */
function deriveOpenSections(pathname: string): Set<string> {
  const open = new Set<string>();
  for (const g of NAV_GROUPS) {
    if (isGroupActive(g, pathname)) {
      open.add(g.id);
    }
  }
  return open;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminSidebar() {
  const location = useLocation();
  const { identity } = useRestaurantIdentity();
  const { t } = useTranslation("sidebar");
  const isConfig = location.pathname.startsWith("/admin/config");

  const moduleStates = useConfigModuleStates();
  const banner = useSidebarBanner();

  const [openSections, setOpenSections] = useState<Set<string>>(() =>
    deriveOpenSections(location.pathname),
  );

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarInner}>
        <div className={styles.brandSection}>
          <RestaurantHeader
            name={identity.name}
            logoUrl={identity.logoUrl}
            size="sm"
          />
        </div>

        {/* Phase 5: Contextual banner — state-aware hint */}
        <SidebarContextBanner banner={banner} />

        {isConfig ? (
          <>
            <NavLink to="/admin/home" className={styles.backLink}>
              {t("nav.backToMenu")}
            </NavLink>
            <div className={styles.configLabel}>{t("nav.configTitle")}</div>
            <nav aria-label={t("nav.configTitle")} className={styles.navColumn}>
              {CONFIG_SECTIONS.map((section) => (
                <div key={section.sectionKey} className={styles.configSection}>
                  <div className={styles.configSectionHeader}>
                    {t(section.sectionKey)}
                  </div>
                  {section.items.map(({ path, labelKey, to }) => {
                    const modState = moduleStates[path];
                    return (
                      <AdminSidebarLink
                        key={path}
                        to={to ?? `/admin/config/${path}`}
                        end={!!to}
                        title={modState ? t(modState.statusKey) : undefined}
                      >
                        {t(labelKey)}
                        {modState && (
                          <ModuleStatusDot status={modState.status} />
                        )}
                      </AdminSidebarLink>
                    );
                  })}
                </div>
              ))}
            </nav>
          </>
        ) : (
          <nav aria-label="Admin navigation" className={styles.navColumnMain}>
            {/* Home — always visible, no group */}
            <AdminSidebarLink to="/admin/home">
              {t("nav.home")}
            </AdminSidebarLink>

            <div className={styles.groupsDivider} />

            {/* Strategic groups */}
            {NAV_GROUPS.map((group) => {
              const isOpen = openSections.has(group.id);
              const hasActive = isGroupActive(group, location.pathname);
              return (
                <div key={group.id} className={styles.sidebarGroup}>
                  <button
                    type="button"
                    onClick={() => toggleSection(group.id)}
                    className={styles.groupHeader}
                    data-active={hasActive ? "" : undefined}
                    data-open={isOpen ? "" : undefined}
                  >
                    <span className={styles.groupIcon}>{group.icon}</span>
                    <span className={styles.groupTitle}>
                      {t(group.titleKey)}
                    </span>
                    <span className={styles.groupChevron}>›</span>
                  </button>
                  {isOpen && (
                    <div className={styles.groupItems}>
                      {group.items.map((item) => (
                        <AdminSidebarLink key={item.to} to={item.to}>
                          {t(item.labelKey)}
                        </AdminSidebarLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}
      </div>
      <div className={styles.footer}>
        <ChefIAppSignature variant="full" size="sm" tone="light" />
      </div>
    </aside>
  );
}

function AdminSidebarLink({
  to,
  end,
  children,
  title,
}: {
  to: string;
  end?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={title}
      className={({ isActive }) =>
        [styles.navLink, isActive && styles.navLinkActive]
          .filter(Boolean)
          .join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

/* ------------------------------------------------------------------ */
/*  ModuleStatusDot — Subtle indicator for module-linked config items  */
/* ------------------------------------------------------------------ */

const STATUS_DOT_CLASS: Record<ModuleStatus, string> = {
  active: styles.statusDotActive,
  needs_setup: styles.statusDotNeedsSetup,
  inactive: styles.statusDotInactive,
  locked: styles.statusDotLocked,
};

function ModuleStatusDot({ status }: { status: ModuleStatus }) {
  return (
    <span
      className={`${styles.statusDot} ${STATUS_DOT_CLASS[status]}`}
      aria-hidden="true"
    />
  );
}
