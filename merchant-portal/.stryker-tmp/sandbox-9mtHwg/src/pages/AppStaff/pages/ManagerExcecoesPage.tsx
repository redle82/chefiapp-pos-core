/**
 * Exceções — Sala de Alarme (/app/staff/mode/alerts).
 *
 * Pergunta: "Há algo que precisa de ação imediata?"
 *
 * Regras:
 *   • Não é para explorar — é para CONFIRMAR, ENTENDER e VOLTAR
 *   • Nenhuma navegação profunda
 *   • Só ações corretivas ou retorno
 */

import { useNavigate } from "react-router-dom";
import { Button } from "../../../ui/design-system/Button";
import { Card } from "../../../ui/design-system/Card";
import { Text } from "../../../ui/design-system/primitives/Text";
import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";

export function ManagerExcecoesPage() {
  const { specDrifts } = useStaff();
  const navigate = useNavigate();
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
      <div>
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
        <Text
          size="sm"
          color="secondary"
          style={{ marginTop: 4, fontStyle: "italic" }}
        >
          Há algo que precisa de ação imediata?
        </Text>
      </div>

      {hasAlerts ? (
        <Card
          surface="layer1"
          padding="md"
          style={{ borderLeft: `4px solid ${colors.destructive.base}` }}
        >
          <Text
            size="sm"
            weight="bold"
            color="primary"
            style={{ marginBottom: 8 }}
          >
            {specDrifts.length} alerta{specDrifts.length !== 1 ? "s" : ""} ativo
            {specDrifts.length !== 1 ? "s" : ""}
          </Text>
          <Text size="sm" color="tertiary">
            Resolver no fluxo operacional (TPV, KDS, Tarefas).
          </Text>
        </Card>
      ) : null}

      <Card surface="layer1" padding="md">
        <Text
          size="sm"
          weight="bold"
          color="primary"
          style={{ marginBottom: 8 }}
        >
          Falhas
        </Text>
        <Text size="sm" color="tertiary">
          Nenhuma falha ativa.
        </Text>
      </Card>

      <Card surface="layer1" padding="md">
        <Text
          size="sm"
          weight="bold"
          color="primary"
          style={{ marginBottom: 8 }}
        >
          Dispositivos offline
        </Text>
        <Text size="sm" color="tertiary">
          Todos os dispositivos ligados.
        </Text>
      </Card>

      <Card surface="layer1" padding="md">
        <Text
          size="sm"
          weight="bold"
          color="primary"
          style={{ marginBottom: 8 }}
        >
          Bloqueios
        </Text>
        <Text size="sm" color="tertiary">
          Nenhum bloqueio ativo.
        </Text>
      </Card>

      {/* Estado vazio — tudo em ordem → ação dominante: VOLTAR */}
      {!hasAlerts && (
        <Card surface="layer2" padding="lg" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <Text size="sm" weight="bold" color="secondary">
            Tudo em ordem
          </Text>
          <Text size="sm" color="tertiary" style={{ marginTop: 4 }}>
            Sem exceções ativas. Volte à operação.
          </Text>
          <Button
            size="sm"
            tone="action"
            style={{ marginTop: 12 }}
            onClick={() => navigate(-1)}
          >
            Voltar
          </Button>
        </Card>
      )}
    </div>
  );
}
