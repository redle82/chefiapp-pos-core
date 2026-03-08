/**
 * HelpPage — Centro de ajuda mínimo.
 * Secções: Como começar, Primeiros 30 minutos, Criar ementa, Abrir turno, Receber pedidos, Imprimir recibo, FAQ.
 * Acessível em /app/help (Staff: More → Ajuda; Admin: Governar → Centro de Ajuda).
 */

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "../../ui/design-system";
import styles from "./HelpPage.module.css";

export function HelpPage() {
  const { t } = useTranslation("common");
  return (
    <div className={styles.pageWrapper}>
      <h1 className={styles.pageTitle}>{t("common:help.title")}</h1>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("common:help.howToStart")}</h2>
        <p className={styles.paragraph}>{t("common:help.howToStartBody")}</p>
        <p className={styles.paragraph}>
          <Link to="/app/staff/home" className={styles.link}>
            {t("common:help.goToStaff")}
          </Link>
        </p>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("common:help.first30")}</h2>
        <p className={styles.paragraph}>{t("common:help.first30Intro")}</p>
        <ul className={styles.list}>
          <li>{t("common:help.first30Menu")}</li>
          <li>{t("common:help.first30Shift")}</li>
          <li>{t("common:help.first30Tpv")}</li>
          <li>{t("common:help.first30Receipt")}</li>
        </ul>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("common:help.createMenu")}</h2>
        <p className={styles.paragraph}>{t("common:help.createMenuBody")}</p>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("common:help.openShift")}</h2>
        <p className={styles.paragraph}>{t("common:help.openShiftBody")}</p>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("common:help.receiveOrders")}</h2>
        <p className={styles.paragraph}>{t("common:help.receiveOrdersBody")}</p>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("common:help.printReceipt")}</h2>
        <p className={styles.paragraph}>{t("common:help.printReceiptBody2")}</p>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("common:help.faqSectionTitle")}</h2>
        <div className={styles.faqItem}>
          <p className={styles.faqQuestion}>{t("common:help.faqQ4")}</p>
          <p className={styles.faqAnswer}>{t("common:help.faqA4")}</p>
        </div>
        <div className={styles.faqItem}>
          <p className={styles.faqQuestion}>{t("common:help.faqQ5")}</p>
          <p className={styles.faqAnswer}>{t("common:help.faqA5")}</p>
        </div>
        <div className={styles.faqItem}>
          <p className={styles.faqQuestion}>{t("common:help.faqQ6")}</p>
          <p className={styles.faqAnswer}>{t("common:help.faqA6")}</p>
        </div>
        <div className={styles.faqItem}>
          <p className={styles.faqQuestion}>{t("common:help.faqQ7")}</p>
          <p className={styles.faqAnswer}>{t("common:help.faqA7")}</p>
        </div>
      </Card>
    </div>
  );
}
