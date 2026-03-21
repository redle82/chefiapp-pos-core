# Fechamento de Caixa — Arquitectura Unificada

**Propósito:** Documenta a unificação dos caminhos de fechamento de caixa. Ref: [STRATEGIC_DECISION_FRAMEWORK](../strategy/STRATEGIC_DECISION_FRAMEWORK.md), migration `20260405_gm_z_reports_unified.sql`.

---

## 1. Fonte única: gm_z_reports

Tabela `gm_z_reports` é o audit trail de todos os Z-reports (fechamento de turno ou diário).

| Coluna | Descrição |
|--------|-----------|
| id | UUID |
| restaurant_id | FK |
| cash_register_id | FK (null para fechamento diário) |
| report_date | DATA |
| report_type | 'shift' \| 'day' |
| z_report | JSONB (snapshot completo) |
| closed_by | Texto |
| closed_at | Timestamp |

---

## 2. Caminhos de escrita

| Operação | RPC / Código | Popula gm_z_reports |
|----------|--------------|---------------------|
| Fechar turno (UI) | close_cash_register_atomic | Sim (report_type='shift') |
| Fechar dia (FinanceEngine) | create_day_z_report | Sim (report_type='day') |

---

## 3. Quem usa

| Componente | Uso |
|------------|-----|
| ShiftCloseReport.tsx | Chama close_cash_register_atomic; exibe Z-report retornado |
| OrderContextReal.closeCashRegister | Chama close_cash_register_atomic |
| FinanceEngine.closeDay | Chama create_day_z_report |
| FinanceEngine.getZReport | Lê de gm_z_reports |

---

## 4. Unificação completa

- **Antes:** close_cash_register_atomic gerava Z-report mas não persistia; havia caminhos separados.
- **Depois:** close_cash_register_atomic persiste em gm_z_reports; create_day_z_report persiste fechamentos diários. Toda a leitura de Z-reports passa por gm_z_reports.
