import React from "react";
import type { PressureMetrics } from "../../intelligence/forecast/PressureForecast";
import type { ShiftPrediction } from "../../intelligence/forecast/ShiftPredictor";
import { Card } from "./Card";
import { Text } from "./primitives/Text";
import { colors } from "./tokens/colors";

interface ShiftForecastWidgetProps {
  pressure: PressureMetrics;
  prediction: ShiftPrediction;
}

export const ShiftForecastWidget: React.FC<ShiftForecastWidgetProps> = ({
  pressure,
  prediction,
}) => {
  // 1. Determine Visual State based on Pressure
  const bg = colors.surface.layer1;
  let accent = colors.success.base;
  let label = "Operação Calma";

  if (pressure.status === "tension") {
    accent = colors.warning.base;
    label = "Tensão Operacional";
  } else if (pressure.status === "peak") {
    accent = colors.destructive.base;
    label = "PICO DE PRESSÃO";
  }

  // 2. Determine Prediction Text
  const predictionText = prediction.message
    ? `🔮 ${prediction.message}`
    : "🔮 Sem picos previstos para breve";

  return (
    <Card
      surface="layer2"
      padding="none"
      style={{
        backgroundColor: bg,
        border: `1px solid ${colors.border.subtle}`,
        borderLeft: `4px solid ${accent}`,
        padding: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <Text
            size="xs"
            weight="bold"
            style={{
              color: accent,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {label}
          </Text>
          <div style={{ marginTop: 4 }}>
            <Text size="xs" color="tertiary">
              Index: {pressure.pressureIndex} (Pedidos:{" "}
              {pressure.ordersLastWindow})
            </Text>
          </div>
        </div>
        {pressure.status !== "calm" && (
          <div
            style={{
              padding: "2px 6px",
              borderRadius: 4,
              backgroundColor: accent,
              color: "white",
              fontSize: 10,
              fontWeight: "bold",
            }}
          >
            AGIR
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: `1px solid ${colors.border.subtle}`,
        }}
      >
        <Text size="xs" color="secondary" style={{ fontStyle: "italic" }}>
          {predictionText}
        </Text>
      </div>
    </Card>
  );
};
