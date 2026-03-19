/**
 * TipsPage — Admin page showing the TipSummaryWidget.
 *
 * Accessible at /admin/tips.
 */

import { useTranslation } from "react-i18next";
import { TipSummaryWidget } from "./TipSummaryWidget";

export function TipsPage() {
  const { t } = useTranslation("tips");

  return (
    <section className="page-enter">
      <header style={{ marginBottom: 24 }}>
        <h1 className="admin-page-title">{t("widgetTitle")}</h1>
      </header>
      <div style={{ maxWidth: 520 }}>
        <TipSummaryWidget />
      </div>
    </section>
  );
}
