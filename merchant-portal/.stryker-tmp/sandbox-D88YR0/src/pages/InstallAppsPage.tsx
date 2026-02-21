/**
 * InstallAppsPage — Mobile app download links
 *
 * This page shows direct links to download ChefIApp Staff from:
 * - Apple App Store
 * - Google Play Store
 *
 * Rota: /install/apps
 */

import styles from "./InstallPage.module.css";

export function InstallAppsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <div className={styles.icon}>📱</div>
        <h1 className={styles.heading}>ChefIApp Staff</h1>
        <p className={styles.subtitle}>
          Escolha a loja compatível com o seu dispositivo
        </p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardHeading}>Disponível em</h2>
        <div className={styles.storesGrid}>
          {/* iOS / Apple App Store */}
          <div className={styles.storeOption}>
            <div className={styles.storeIcon}>🍎</div>
            <h3 className={styles.storeName}>App Store</h3>
            <p className={styles.storeDesc}>iPhone & iPad</p>
            <button type="button" disabled className={styles.storeBtn}>
              <span className={styles.comingSoon}>Em breve</span>
            </button>
          </div>

          {/* Android / Google Play */}
          <div className={styles.storeOption}>
            <div className={styles.storeIcon}>🤖</div>
            <h3 className={styles.storeName}>Google Play</h3>
            <p className={styles.storeDesc}>Android</p>
            <button type="button" disabled className={styles.storeBtn}>
              <span className={styles.comingSoon}>Em breve</span>
            </button>
          </div>
        </div>

        {/* Install Information */}
        <div className={styles.infoBox}>
          <h4 className={styles.infoTitle}>💡 Qual é a diferença?</h4>
          <ul className={styles.infoList}>
            <li>
              <strong>App Store (Apple):</strong> Para iPhone e iPad. Faça login
              com Apple ID ou e-mail da sua conta.
            </li>
            <li>
              <strong>Google Play (Android):</strong> Para telemóveis e tablets
              com Android. Faça login com conta Google.
            </li>
          </ul>
        </div>

        {/* How It Works */}
        <div className={styles.infoBox + " " + styles.infoBoxAlt}>
          <h4 className={styles.infoTitle}>✓ Como funciona</h4>
          <ol className={styles.infoListOrdered}>
            <li>Descarregue a app da sua loja</li>
            <li>Abra a app e faça login com a sua conta</li>
            <li>O seu dispositivo será reconhecido automaticamente</li>
          </ol>
        </div>
      </div>

      <a href="/admin/devices" className={styles.linkGold}>
        ← Voltar a Dispositivos
      </a>
    </div>
  );
}
