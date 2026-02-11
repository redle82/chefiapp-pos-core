/**
 * OperationModePage — Diagnóstico da Operação (nível 3 — ferramenta).
 *
 * Pergunta: "POR QUE está ok / em risco?"
 *
 * Não é dashboard — é diagnóstico técnico.
 * Tudo aqui explica causa, não resultado.
 *
 * Ref: reset arquitetura operacional — um app, uma navegação, papel só filtra.
 * UI: scroll é do Shell; sem dashboard/portal; sem duplicar layout.
 */

import { ManagerDashboard } from "../ManagerDashboard";

export function OperationModePage() {
  return <ManagerDashboard />;
}
