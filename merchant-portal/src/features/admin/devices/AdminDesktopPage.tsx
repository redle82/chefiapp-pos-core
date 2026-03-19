import { useTranslation } from "react-i18next";
import { useDesktopHealth } from "../../../core/desktop/useDesktopHealth";
import { AdminPageHeader } from "../dashboard/components/AdminPageHeader";
import { AdminSurfaceLayout } from "../layout/AdminSurfaceLayout";
import styles from "./AdminDevicesPage.module.css";
import { DesktopDownloadSection } from "./DesktopDownloadSection";

export function AdminDesktopPage() {
  const { t } = useTranslation("devices");
  const { status, health, recheck } = useDesktopHealth();

  const hero = (
    <section className={`${styles.card} ${styles.detectionCard}`}>
      {status === "checking" && (
        <div className={styles.detectionBanner}>
          <span className={styles.detectionChecking}>Verificando Desktop…</span>
        </div>
      )}
      {status === "detected" && (
        <div className={styles.detectionBanner}>
          <span className={styles.detectedBadge}>✅ Desktop detectado</span>
          {health?.version && (
            <span className={styles.detectionVersion}>
              versão {health.version}
            </span>
          )}
          <button
            type="button"
            className={styles.verifyButton}
            onClick={recheck}
          >
            Verificar novamente
          </button>
        </div>
      )}
      {status === "not_found" && (
        <div className={styles.detectionBanner}>
          <span className={styles.notFoundBadge}>Desktop não detectado</span>
          <span className={styles.detectionHint}>
            Instale e abra o ChefIApp Desktop para que ele apareça aqui.
          </span>
          <button
            type="button"
            className={styles.verifyButton}
            onClick={recheck}
          >
            Verificar instalação
          </button>
        </div>
      )}
    </section>
  );

  const main = (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>{t("downloadTitle")}</h2>
      <p className={styles.sectionDesc}>{t("downloadDesc")}</p>

      <DesktopDownloadSection onVerify={recheck} healthStatus={status} />
    </section>
  );

  const aside = (
    <>
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Política de distribuição</h2>
        <p className={styles.sectionDesc}>
          O Desktop agrupa TPV e KDS no mesmo instalador e deve ser tratado como
          superfície operacional dedicada.
        </p>
        <div className={styles.distributionNote}>
          <span className={styles.distributionIcon}>🛡️</span>
          <div>
            <strong>{t("distributionTitle")}</strong>
            <p className={styles.distributionText}>{t("distributionText")}</p>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Ajuda rápida</h2>
        <p className={styles.sectionDesc}>
          Verifique a instalação, confirme o handler do protocolo e valide se a
          app está aberta antes de testar os links do TPV/KDS.
        </p>
        <div className={styles.quickHelpList}>
          <div className={styles.quickHelpItem}>
            1. Instalar a app em /Applications
          </div>
          <div className={styles.quickHelpItem}>
            2. Abrir a app uma vez manualmente
          </div>
          <div className={styles.quickHelpItem}>
            3. Reexecutar a verificação neste painel
          </div>
        </div>
      </section>
    </>
  );

  const bottom = (
    <div className={styles.utilityGrid}>
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Estado atual</h2>
        <p className={styles.sectionDesc}>
          {status === "detected"
            ? "O runtime de desktop está disponível e pronto para abrir superfícies operacionais."
            : status === "checking"
            ? "A detecção está em curso. Aguarde alguns segundos antes de repetir o teste."
            : "Ainda não há runtime ativo. O download e a instalação devem ser concluídos primeiro."}
        </p>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Depois da instalação</h2>
        <p className={styles.sectionDesc}>
          Reabra o admin, valide a deteção e só depois siga para o pareamento
          dos dispositivos operacionais.
        </p>
      </section>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <AdminPageHeader title="Desktop TPV + KDS" subtitle={t("downloadDesc")} />

      <AdminSurfaceLayout
        variant="operational"
        hero={hero}
        main={main}
        aside={aside}
        bottom={bottom}
      />
    </div>
  );
}
