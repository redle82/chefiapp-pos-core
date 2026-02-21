// @ts-nocheck
import { OSSignature } from "../design-system/sovereign/OSSignature";
import styles from "./BillingBlockedView.module.css";

export function BillingBlockedView() {
  return (
    <div className={styles.root}>
      {/* Background Decor */}
      <div className={styles.backdrop} />

      <div className={styles.card}>
        <div className={styles.signature}>
          <OSSignature state="ember" size="lg" />
        </div>

        <h1 className={styles.title}>Operação Pausada</h1>

        <p className={styles.description}>
          O ChefIApp detectou uma pendência de faturação. Para garantir a
          integridade dos seus dados e retomar as vendas, por favor regularize o
          estado da conta.
        </p>

        <button
          className={styles.primaryButton}
          onClick={() => (window.location.href = "/app/billing")}
        >
          Regularizar agora
        </button>

        <button
          className={styles.secondaryButton}
          onClick={() => (window.location.href = "/support")}
        >
          Contactar Suporte
        </button>
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          CHEF-OS CORE v2.2 • BILLING ENFORCEMENT
        </p>
      </div>
    </div>
  );
}
