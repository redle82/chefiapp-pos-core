/**
 * InstallAppsPage — Mobile app download links
 *
 * This page shows direct links to download ChefIApp Staff from:
 * - Apple App Store
 * - Google Play Store
 *
 * Rota: /install/apps
 */

import { useTranslation } from "react-i18next";
import styles from "./InstallPage.module.css";

export function InstallAppsPage() {
  const { t } = useTranslation("common");

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <div className={styles.icon}>📱</div>
        <h1 className={styles.heading}>ChefIApp Staff</h1>
        <p className={styles.subtitle}>
          {t("installApps.subtitle")}
        </p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardHeading}>{t("installApps.availableIn")}</h2>
        <div className={styles.storesGrid}>
          {/* iOS / Apple App Store */}
          <div className={styles.storeOption}>
            <div className={styles.storeIcon}>🍎</div>
            <h3 className={styles.storeName}>App Store</h3>
            <p className={styles.storeDesc}>iPhone & iPad</p>
            <button type="button" disabled className={styles.storeBtn}>
              <span className={styles.comingSoon}>{t("installApps.comingSoon")}</span>
            </button>
          </div>

          {/* Android / Google Play */}
          <div className={styles.storeOption}>
            <div className={styles.storeIcon}>🤖</div>
            <h3 className={styles.storeName}>Google Play</h3>
            <p className={styles.storeDesc}>Android</p>
            <button type="button" disabled className={styles.storeBtn}>
              <span className={styles.comingSoon}>{t("installApps.comingSoon")}</span>
            </button>
          </div>
        </div>

        {/* Install Information */}
        <div className={styles.infoBox}>
          <h4 className={styles.infoTitle}>{t("installApps.differenceTitle")}</h4>
          <ul className={styles.infoList}>
            <li>
              <strong>App Store (Apple):</strong> {t("installApps.appleDesc")}
            </li>
            <li>
              <strong>Google Play (Android):</strong> {t("installApps.androidDesc")}
            </li>
          </ul>
        </div>

        {/* How It Works */}
        <div className={styles.infoBox + " " + styles.infoBoxAlt}>
          <h4 className={styles.infoTitle}>{t("installApps.howItWorksTitle")}</h4>
          <ol className={styles.infoListOrdered}>
            <li>{t("installApps.step1")}</li>
            <li>{t("installApps.step2")}</li>
            <li>{t("installApps.step3")}</li>
          </ol>
        </div>
      </div>

      <a href="/admin/devices" className={styles.linkGold}>
        {t("installApps.backToDevices")}
      </a>
    </div>
  );
}
