import React from "react";
import styles from "./HighRiskBanner.module.css";

export function HighRiskBanner() {
  return (
    <div className={styles.banner}>
      <strong>⚠ Alto Risco Financeiro</strong>
      <p style={{ margin: "8px 0 0 0", fontSize: "0.9rem" }}>
        O score de risco indica discrepâncias significativas. Revise os locais em
        estado crítico e tome medidas corretivas.
      </p>
    </div>
  );
}
