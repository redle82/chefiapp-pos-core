import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getAuthActions } from "../../../../core/auth/authAdapter";
import { LOGOUT_IN_PROGRESS_KEY } from "../../../../core/auth/authKeycloak";
import { useAuth } from "../../../../core/auth/useAuth";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import { SOFIA_RESTAURANT_ID } from "../../../../core/readiness/operationalRestaurant";
import { useTenant } from "../../../../core/tenant/TenantContext";
import {
  resolveOperatorProfile,
} from "../../../../pages/TPV/context/operatorIdentity";
import { RestaurantHeader } from "../../../../ui/design-system/sovereign/RestaurantHeader";
import styles from "./AdminTopbar.module.css";

/** Mock pilot = dono do Sofia no Docker; UI deve mostrar explicitamente "Dono" (PT-BR). */
const PILOT_USER_UUID = "00000000-0000-0000-0000-000000000002";

export function AdminTopbar() {
  const { t } = useTranslation("dashboard");
  const { user, loading: authLoading } = useAuth();
  const { identity } = useRestaurantIdentity();
  const { tenantId, memberships } = useTenant();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userEmail = user?.email ?? "";
  const operatorProfile = resolveOperatorProfile(user);
  const isAnonymousSession =
    !user && (!operatorProfile.id || operatorProfile.id === "—");
  /** After logout, auth is loaded and user is null — show session ended, not "owner" */
  const isLoggedOut = !authLoading && !user;

  const displayName = isLoggedOut
    ? t("topbar.sessionEnded", { defaultValue: "Sessão encerrada" })
    : isAnonymousSession
      ? t("topbar.localOwnerName", {
          defaultValue: "Dono deste restaurante",
        })
      : operatorProfile.name ||
        userEmail ||
        t("topbar.fallbackUser", { defaultValue: "Utilizador" });
  const userInitial = displayName.charAt(0).toUpperCase();
  const activeMembership =
    memberships.find((m) => m.restaurant_id === tenantId) ?? memberships[0];
  const membershipRole = (activeMembership?.role ?? "").toLowerCase();
  const userRole = String(user?.user_metadata?.role ?? "").toLowerCase();
  const effectiveRole = membershipRole || userRole;
  const isInternalAdmin =
    effectiveRole === "internal" ||
    effectiveRole === "internal_admin" ||
    effectiveRole === "system_admin";
  /** Sofia oficial: pilot mock é dono do restaurante 100 — mostrar "Dono" (PT-BR) na UI. */
  const isSofiaContext =
    tenantId === SOFIA_RESTAURANT_ID || identity?.id === SOFIA_RESTAURANT_ID;
  const isSofiaPilotOwner =
    !isLoggedOut && user?.id === PILOT_USER_UUID && isSofiaContext;
  const roleLabel = isSofiaPilotOwner
    ? t("topbar.roleOwner", { defaultValue: "Dono" })
    : effectiveRole && effectiveRole.length > 0
      ? effectiveRole === "owner"
        ? t("topbar.roleOwner", { defaultValue: "Dono" })
        : effectiveRole === "manager"
        ? t("topbar.roleManager", { defaultValue: "Gerente" })
        : effectiveRole === "cashier"
        ? t("topbar.roleCashier", { defaultValue: "Caixa" })
        : effectiveRole === "waiter"
        ? t("topbar.roleWaiter", { defaultValue: "Garçom" })
        : isInternalAdmin
        ? t("topbar.roleInternal", { defaultValue: "Equipe ChefiApp" })
        : effectiveRole
      : isLoggedOut
        ? ""
        : isAnonymousSession
          ? t("topbar.roleOwner", { defaultValue: "Dono" })
          : t("topbar.roleStaff", { defaultValue: "Equipe" });
  const isRoleRedundant =
    displayName.trim().toLowerCase() === roleLabel.trim().toLowerCase();
  const baseRestaurantName =
    identity.name?.trim() ||
    t("topbar.activeRestaurant", { defaultValue: "Restaurante" });
  const activeRestaurantName = (() => {
    if (!identity.environmentLabel) return baseRestaurantName;
    const hasSuffix = /\s\(TEST\)$|\s—\sSandbox$/i.test(baseRestaurantName);
    if (hasSuffix) return baseRestaurantName;
    return identity.environmentLabel === "Sandbox"
      ? `${baseRestaurantName} — Sandbox`
      : `${baseRestaurantName} (TEST)`;
  })();

  const handleLogout = useCallback(() => {
    // Set flag before signOut so beforeunload handlers skip "Leave site?" dialog
    try {
      sessionStorage.setItem(LOGOUT_IN_PROGRESS_KEY, "1");
    } catch {
      // ignore
    }
    const actions = getAuthActions();
    actions.signOut();
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className={`${styles.topbar} admin-topbar-shell`}>
      <div className={styles.left}>
        <RestaurantHeader
          name={activeRestaurantName}
          logoUrl={identity.logoUrl}
          size="sm"
        />
      </div>

      <div className={styles.right} ref={dropdownRef}>
        {/* Profile trigger */}
        <button
          type="button"
          className={styles.profileBtn}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={t("topbar.userMenu")}
          aria-expanded={menuOpen}
          data-testid="topbar-profile"
          data-authenticated={isLoggedOut ? "false" : "true"}
        >
          <div className={styles.avatar}>{userInitial}</div>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{displayName}</span>
            {!isRoleRedundant && (
              <span className={styles.profileRole}>{roleLabel}</span>
            )}
          </div>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{ opacity: 0.5 }}
            className={styles.profileChevron}
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <>
            <div
              className={styles.backdrop}
              onClick={() => setMenuOpen(false)}
              role="presentation"
            />
            <div className={styles.dropdown}>
              {/* User header */}
              <div className={styles.dropdownHeader}>
                <div className={styles.avatarLg}>{userInitial}</div>
                <div className={styles.dropdownHeaderInfo}>
                  <div className={styles.dropdownName}>{displayName}</div>
                    <div className={styles.dropdownEmail}>
                      {isAnonymousSession
                        ? t("topbar.anonymousEmail", {
                            defaultValue: "Sem utilizador autenticado",
                          })
                        : userEmail || "—"}
                    </div>
                  {!isRoleRedundant && (
                    <div className={styles.dropdownRole}>{roleLabel}</div>
                  )}
                </div>
              </div>

              <div className={styles.dropdownDivider} />

              {/* Navigation items */}
              <div className={styles.dropdownSection}>
                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => {
                    navigate("/admin/account");
                    setMenuOpen(false);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle
                      cx="8"
                      cy="5"
                      r="2.5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                    <path
                      d="M3 13.5c0-2.5 2.2-4 5-4s5 1.5 5 4"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                  {t("topbar.myAccount", { defaultValue: "Minha conta" })}
                </button>
                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => {
                    navigate("/admin/config/general");
                    setMenuOpen(false);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M6.86 1.58a1.2 1.2 0 0 1 2.28 0l.35 1.05a1.2 1.2 0 0 0 1.52.72l1.04-.38a1.2 1.2 0 0 1 1.6 1.14l-.04 1.1a1.2 1.2 0 0 0 .93 1.24l1.06.25a1.2 1.2 0 0 1 .57 2.06l-.79.77a1.2 1.2 0 0 0-.24 1.53l.56.95a1.2 1.2 0 0 1-.86 1.8l-1.1.1a1.2 1.2 0 0 0-1.08 1.08l-.1 1.1a1.2 1.2 0 0 1-1.8.86l-.95-.56a1.2 1.2 0 0 0-1.53.24l-.77.79a1.2 1.2 0 0 1-2.06-.57l-.25-1.06A1.2 1.2 0 0 0 4.07 14l-1.1.04A1.2 1.2 0 0 1 1.83 12.44l.38-1.04a1.2 1.2 0 0 0-.72-1.52L.44 9.53a1.2 1.2 0 0 1 0-2.28"
                      stroke="currentColor"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="8"
                      cy="8"
                      r="2"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                  </svg>
                  {t("topbar.restaurantSettings", {
                    defaultValue: "Configurações do restaurante",
                  })}
                </button>
                {isInternalAdmin && (
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      navigate("/admin/observability");
                      setMenuOpen(false);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M2.5 12.5h11M4 10V6m4 4V3m4 7V7"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {t("topbar.systemSettings", {
                      defaultValue: "Configuração do sistema",
                    })}
                  </button>
                )}
              </div>

              <div className={styles.dropdownDivider} />

              {/* Logout */}
              <div className={styles.dropdownSection}>
                <button
                  type="button"
                  className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                  onClick={handleLogout}
                  data-testid="topbar-logout"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M6 2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2M10.5 11.5L14 8l-3.5-3.5M14 8H6"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {t("topbar.logout", { defaultValue: "Sair" })}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
