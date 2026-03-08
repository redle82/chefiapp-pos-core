/**
 * SidebarContextBanner — Contextual awareness banner for the Admin sidebar.
 *
 * Renders a compact, color-coded banner based on SystemState:
 *   SETUP     → amber, progress bar + next step CTA
 *   TRIAL     → blue (urgent: amber), days remaining + upgrade CTA
 *   ACTIVE    → green, quiet confirmation badge
 *   SUSPENDED → red, urgent payment-required warning
 *
 * Phase 5: Contextual Banner — Admin Panel Restructuring.
 */

import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import type {
  BannerVariant,
  SidebarBannerState,
} from "../hooks/useSidebarBanner";
import styles from "./AdminSidebar.module.css";

const VARIANT_CLASS: Record<BannerVariant, string> = {
  setup: styles.bannerSetup,
  trial: styles.bannerTrial,
  active: styles.bannerActive,
  suspended: styles.bannerSuspended,
};

export function SidebarContextBanner({
  banner,
}: {
  banner: SidebarBannerState;
}) {
  const { t } = useTranslation("sidebar");

  return (
    <div
      className={`${styles.contextBanner} ${VARIANT_CLASS[banner.variant]}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.bannerHeadline}>
        {t(banner.headlineKey, banner.params)}
      </div>
      <div className={styles.bannerBody}>
        {t(banner.bodyKey, banner.params)}
      </div>

      {/* Progress bar — only for SETUP */}
      {banner.progress !== null && (
        <div className={styles.bannerProgress}>
          <div
            className={styles.bannerProgressFill}
            style={{ width: `${Math.round(banner.progress * 100)}%` }}
          />
        </div>
      )}

      {/* CTA link */}
      {banner.ctaKey && banner.ctaTo && (
        <NavLink to={banner.ctaTo} className={styles.bannerCta}>
          {t(banner.ctaKey)}
        </NavLink>
      )}
    </div>
  );
}
