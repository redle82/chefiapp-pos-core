/**
 * BillingSuccessPage — Página exibida após checkout Stripe concluído
 *
 * Mensagem clara "Assinatura ativa" e links para Dashboard e TPV.
 */

import { useNavigate } from "react-router-dom";
import { Button, Card } from "../../ui/design-system";
import styles from "./BillingSuccessPage.module.css";

export function BillingSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.pageWrapper}>
      <Card className={styles.card} elevated>
        <div className={styles.icon}>✅</div>
        <h1 className={styles.title}>Assinatura ativa</h1>
        <p className={styles.message}>
          O modo ao vivo foi ativado. O seu restaurante está pronto para operar.
        </p>
        <div className={styles.buttonGroup}>
          <Button type="button" onClick={() => navigate("/dashboard")}>
            Ir ao Comando Central
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/op/tpv")}
          >
            Ir ao TPV
          </Button>
        </div>
      </Card>
    </div>
  );
}
