/**
 * DesktopComingSoonBanner — Honest notice that desktop apps are not yet available.
 *
 * Replaces the 6 "Em breve" download cards with a clear, non-misleading message.
 * Ref: UXG-011 / Issue #19
 */
import styles from "./AdminDevicesPage.module.css";

const EARLY_ACCESS_MAILTO =
  "mailto:soporte@chefiapp.com?subject=Acceso%20anticipado%20TPV/KDS%20desktop";

export function DesktopComingSoonBanner() {
  return (
    <div className={styles.comingSoonBanner}>
      <div className={styles.comingSoonIcon}>🚧</div>
      <div className={styles.comingSoonBody}>
        <h3 className={styles.comingSoonTitle}>
          Software de escritorio en desarrollo
        </h3>
        <p className={styles.comingSoonText}>
          Los módulos TPV y KDS requieren una aplicación de escritorio dedicada
          que estamos preparando. Mientras tanto, puede vincular dispositivos
          móviles (AppStaff) usando el código QR de arriba.
        </p>
        <div className={styles.comingSoonActions}>
          <a
            href={EARLY_ACCESS_MAILTO}
            className={styles.comingSoonCta}
            target="_blank"
            rel="noopener noreferrer"
          >
            Solicitar acceso anticipado
          </a>
          <a href="/admin/config/general" className={styles.comingSoonLink}>
            Saber más
          </a>
        </div>
      </div>
    </div>
  );
}
