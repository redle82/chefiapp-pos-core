/**
 * BillingSuccessPage — Página exibida após checkout Stripe concluído
 *
 * Mensagem clara "Assinatura ativa" e links para Dashboard e TPV.
 */
// @ts-nocheck


import { Link, useNavigate } from "react-router-dom";
import styles from "./BillingSuccessPage.module.css";

export function BillingSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>
        <div className={styles.icon}>✅</div>
        <h1 className={styles.title}>Assinatura ativa</h1>
        <p className={styles.message}>
          O modo ao vivo foi ativado. O seu restaurante está pronto para operar.
        </p>
        <div className={styles.buttonGroup}>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className={styles.buttonPrimary}
          >
            Ir ao Comando Central
          </button>
          <Link to="/op/tpv" className={styles.linkButton}>
            Ir ao TPV
          </Link>
        </div>
      </div>
    </div>
  );
}
