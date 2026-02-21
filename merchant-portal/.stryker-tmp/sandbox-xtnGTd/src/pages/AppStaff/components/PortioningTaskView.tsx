/**
 * PortioningTaskView.tsx — Tela de Porcionamento (Dedo-Único)
 *
 * UI para tasks de porcionamento no AppStaff
 */

import { useState } from "react";
import { CONFIG } from "../../../config";
import { useToast } from "../../../ui/design-system";
import { StaffLayout } from "../../../ui/design-system/layouts/StaffLayout";
import { Button } from "../../../ui/design-system/Button";
import { Card } from "../../../ui/design-system/Card";
import { Text } from "../../../ui/design-system/primitives/Text";
import type { Task } from "../context/StaffCoreTypes";

interface PortioningTaskViewProps {
  task: Task;
  onComplete: () => void;
}

export function PortioningTaskView({
  task,
  onComplete,
}: PortioningTaskViewProps) {
  const { success, error } = useToast();
  const [selectedVariation, setSelectedVariation] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  // Extract task context
  const targetWeight = task.context?.target_weight_g || 150;
  const targetThickness = task.context?.target_thickness_mm || 12;
  const targetPortions = task.context?.target_portions || 22;
  const sessionId = task.context?.session_id;

  const variations = [
    { label: "Ok (dentro do padrão)", value: 0, color: "#10b981" },
    { label: "Acima +10g", value: 10, color: "#f59e0b" },
    { label: "Acima +20g", value: 20, color: "#f59e0b" },
    { label: "Acima +40g", value: 40, color: "#ef4444" },
    { label: "Abaixo -10g", value: -10, color: "#f59e0b" },
    { label: "Abaixo -20g", value: -20, color: "#ef4444" },
  ];

  const handleSubmit = async () => {
    if (selectedVariation === null) {
      error("Selecione uma variação");
      return;
    }

    if (!sessionId) {
      error("Sessão não encontrada");
      return;
    }

    setLoading(true);
    try {
      const measuredWeight = targetWeight + selectedVariation;
      const { getTabIsolated } = await import(
        "../../../core/storage/TabIsolatedStorage"
      );
      const restaurantId = getTabIsolated("chefiapp_restaurant_id");

      const response = await fetch(
        `${CONFIG.API_BASE}/api/portioning/measurements`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            measured_weight_g: measuredWeight,
            measured_thickness_mm: targetThickness,
            notes: variations.find((v) => v.value === selectedVariation)?.label,
            restaurant_id: restaurantId,
          }),
        },
      );

      if (response.ok) {
        success("Medição registrada");
        onComplete();
      } else {
        const data = await response.json();
        error(data.error || "Erro ao registrar medição");
      }
    } catch {
      error("Erro ao registrar medição");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StaffLayout title={task.title} role="kitchen" status="active">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          padding: 16,
        }}
      >
        {/* Target Info */}
        <Card surface="layer2" padding="lg">
          <Text
            size="lg"
            weight="bold"
            color="primary"
            style={{ marginBottom: 16 }}
          >
            Alvo
          </Text>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div>
              <Text size="xs" color="secondary">
                Gramatura
              </Text>
              <Text size="2xl" weight="bold">
                {targetWeight}g
              </Text>
            </div>
            <div>
              <Text size="xs" color="secondary">
                Espessura
              </Text>
              <Text size="2xl" weight="bold">
                {targetThickness}mm
              </Text>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Text size="xs" color="secondary">
                Porções
              </Text>
              <Text size="xl" weight="bold">
                {targetPortions} porções
              </Text>
            </div>
          </div>
        </Card>

        {/* Variation Buttons */}
        <div>
          <Text
            size="md"
            weight="bold"
            color="primary"
            style={{ marginBottom: 16 }}
          >
            Medição Real
          </Text>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
            }}
          >
            {variations.map((variation) => (
              <Button
                key={variation.value}
                onClick={() => setSelectedVariation(variation.value)}
                variant={
                  selectedVariation === variation.value ? "primary" : "outline"
                }
                size="lg"
                style={{
                  minHeight: 80,
                  borderColor:
                    selectedVariation === variation.value
                      ? variation.color
                      : undefined,
                  borderWidth: selectedVariation === variation.value ? 3 : 1,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <Text size="sm" weight="bold">
                    {variation.label}
                  </Text>
                  {variation.value !== 0 && (
                    <Text size="xs" color="secondary">
                      {variation.value > 0 ? "+" : ""}
                      {variation.value}g
                    </Text>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          variant="primary"
          size="lg"
          fullWidth
          disabled={selectedVariation === null || loading}
          style={{ minHeight: 64 }}
        >
          {loading ? "Registrando..." : "Confirmar Medição"}
        </Button>

        {/* Why Badge */}
        {task.meta?.event_id && (
          <Card surface="layer2" padding="sm">
            <Text size="xs" color="tertiary">
              🔗 Criada por regra após evento de porcionamento
            </Text>
          </Card>
        )}
      </div>
    </StaffLayout>
  );
}
