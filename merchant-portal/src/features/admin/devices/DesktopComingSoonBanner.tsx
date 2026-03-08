/**
 * DesktopComingSoonBanner — Honest notice that desktop apps are not yet available.
 *
 * Replaces the 6 "Em breve" download cards with a clear, non-misleading message.
 * Ref: UXG-011 / Issue #19
 */
import { useTranslation } from "react-i18next";
import styles from "./AdminDevicesPage.module.css";

const EARLY_ACCESS_MAILTO =
  "mailto:soporte@chefiapp.com?subject=Acceso%20anticipado%20TPV/KDS%20desktop";

export function DesktopComingSoonBanner() {
  const { t } = useTranslation("devices");

  return (
    <div className={styles.comingSoonBanner}>
      <div className={styles.comingSoonIcon}>🚧</div>
      <div className={styles.comingSoonBody}>
        <h3 className={styles.comingSoonTitle}>{t("comingSoon.title")}</h3>
        <p className={styles.comingSoonText}>{t("comingSoon.body")}</p>
        <div className={styles.comingSoonActions}>
          <a
            href={EARLY_ACCESS_MAILTO}
            className={styles.comingSoonCta}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("comingSoon.requestEarlyAccess")}
          </a>
          <a href="/admin/config/general" className={styles.comingSoonLink}>
            {t("comingSoon.learnMore")}
          </a>
        </div>
      </div>
    </div>
  );
}
