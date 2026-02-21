/**
 * PublishPage — Publicar restaurante (CAMINHO_DO_CLIENTE)
 *
 * /app/publish — Botão "Publicar restaurante"; isPublished = true.
 * Libera KDS, TPV, presença online, apps operacionais.
 */
// @ts-nocheck


import { PublishSection } from "./Onboarding/sections/PublishSection";
import styles from "./PublishPage.module.css";

export function PublishPage() {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Publicar restaurante</h1>
        <p className={styles.subtitle}>
          Ative o seu restaurante para usar TPV, KDS e presença online.
        </p>
      </div>
      <PublishSection />
    </div>
  );
}
