// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthActions } from "../../../../core/auth/authAdapter";
import { useAuth } from "../../../../core/auth/useAuth";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import { RestaurantHeader } from "../../../../ui/design-system/sovereign/RestaurantHeader";
import styles from "./AdminTopbar.module.css";

export function AdminTopbar() {
  const { user } = useAuth();
  const { identity } = useRestaurantIdentity();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userEmail = user?.email ?? "";
  const userName =
    (user?.user_metadata?.name as string) || userEmail.split("@")[0] || "—";
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = useCallback(() => {
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
    <header className={styles.topbar}>
      <div className={styles.left}>
        <RestaurantHeader
          name={identity.name}
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
          aria-label="Menu do utilizador"
          aria-expanded={menuOpen}
        >
          <div className={styles.avatar}>{userInitial}</div>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{ opacity: 0.5 }}
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
                  <div className={styles.dropdownName}>{userName}</div>
                  <div className={styles.dropdownEmail}>{userEmail || "—"}</div>
                  <div className={styles.dropdownRole}>Proprietário</div>
                </div>
              </div>

              <div className={styles.dropdownDivider} />

              {/* Navigation items */}
              <div className={styles.dropdownSection}>
                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => {
                    navigate("/admin/config");
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
                  Minha conta
                </button>
                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => {
                    navigate("/admin/config");
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
                  Configurações
                </button>
              </div>

              <div className={styles.dropdownDivider} />

              {/* Logout */}
              <div className={styles.dropdownSection}>
                <button
                  type="button"
                  className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                  onClick={handleLogout}
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
                  Terminar sessão
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
