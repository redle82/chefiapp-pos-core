/**
 * Exceções (/app/staff/mode/alerts).
 * Uma tela = resolver problemas: falhas, dispositivos offline, bloqueios.
 * Estados: loading, vazio, erro (FASE 5); UX app: feedback tátil, sem hover (FASE 6).
 */

import React from "react";
import { Card } from "../../../ui/design-system/primitives/Card";
import { Text } from "../../../ui/design-system/primitives/Text";
import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";

export function ManagerExcecoesPage() {
  const { specDrifts } = useStaff();
  const hasAlerts = specDrifts.length > 0;

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        width: "100%",
        paddingBottom: 80,
      }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          margin: 0,
          color: colors.text.primary,
        }}
      >
        Exceções
      </h1>

      <Text size="sm" color="tertiary" style={{ marginBottom: 8 }}>
        Falhas, dispositivos offline e bloqueios do sistema.
      </Text>

      {hasAlerts ? (
        <Card surface="layer1" padding="md" style={{ borderLeft: `4px solid ${colors.destructive.base}` }}>
          <Text size="sm" weight="bold" color="primary" style={{ marginBottom: 8 }}>
            {specDrifts.length} alerta(s) ativo(s)
          </Text>
          <Text size="sm" color="tertiary">
            Resolver no fluxo operacional (TPV, KDS, Tarefas).
          </Text>
        </Card>
      ) : null}

      <Card surface="layer1" padding="md">
        <Text size="sm" weight="bold" color="primary" style={{ marginBottom: 8 }}>
          Falhas
        </Text>
        <Text size="sm" color="tertiary">
          Nenhuma falha ativa.
        </Text>
      </Card>

      <Card surface="layer1" padding="md">
        <Text size="sm" weight="bold" color="primary" style={{ marginBottom: 8 }}>
          Dispositivos offline
        </Text>
        <Text size="sm" color="tertiary">
          Todos os dispositivos ligados.
        </Text>
      </Card>

      <Card surface="layer1" padding="md">
        <Text size="sm" weight="bold" color="primary" style={{ marginBottom: 8 }}>
          Bloqueios
        </Text>
        <Text size="sm" color="tertiary">
          Nenhum bloqueio ativo.
        </Text>
      </Card>

      {/* Estado vazio explícito + ação dominante: resolver alerta (quando houver) */}
      {!hasAlerts && (
        <Card surface="layer2" padding="lg" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <Text size="sm" weight="bold" color="secondary">
            Tudo em ordem
          </Text>
          <Text size="sm" color="tertiary" style={{ marginTop: 4 }}>
            Sem exceções ativas. Mantenha o foco na operação.
          </Text>
        </Card>
      )}
    </div>
  );
}
