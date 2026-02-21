/**
 * FloorMap — Grid de mesas (Home do Garçom)
 * Princípio: 1 dedo, botões gigantes, zero pensamento.
 */
// @ts-nocheck


import { useTranslation } from "react-i18next";
import { Text } from "../../../ui/design-system/primitives/Text";
import { colors } from "../../../ui/design-system/tokens/colors";
import { spacing } from "../../../ui/design-system/tokens/spacing";
import type { Table } from "../types";
import { TableStatus } from "../types";

interface FloorMapProps {
  tables: Table[];
  area?: string;
  onTableClick: (table: Table) => void;
  onTableLongPress?: (table: Table) => void;
}

const getStatusColor = (status: TableStatus): string => {
  switch (status) {
    case TableStatus.FREE:
      return "#32d74b"; // Verde
    case TableStatus.OCCUPIED:
      return "#ff453a"; // Vermelho
    case TableStatus.CALLING:
      return "#ffd60a"; // Amarelo (piscante)
    case TableStatus.BILL_REQUESTED:
      return "#ff9500"; // Laranja
    case TableStatus.KITCHEN_READY:
      return "#0a84ff"; // Azul
    case TableStatus.CLEANING:
      return "#8e8e93"; // Cinza
    default:
      return "#8e8e93";
  }
};

const getStatusLabelKey = (status: TableStatus): string => {
  switch (status) {
    case TableStatus.FREE:
      return "floorMap.free";
    case TableStatus.OCCUPIED:
      return "floorMap.occupied";
    case TableStatus.CALLING:
      return "floorMap.calling";
    case TableStatus.BILL_REQUESTED:
      return "floorMap.bill";
    case TableStatus.KITCHEN_READY:
      return "floorMap.kitchen";
    case TableStatus.CLEANING:
      return "floorMap.cleaning";
    default:
      return "?";
  }
};

export function FloorMap({
  tables,
  area,
  onTableClick,
  onTableLongPress,
}: FloorMapProps) {
  const { t } = useTranslation("waiter");
  // Grid responsivo: 3 colunas em mobile, 4 em tablet+
  const gridColumns = 3;
  const tableSize = 80; // px (touch target grande)
  const gap = spacing[4]; // 16px

  const handleTableClick = (table: Table) => {
    onTableClick(table);
  };

  const handleTableLongPress = (table: Table) => {
    if (onTableLongPress) {
      onTableLongPress(table);
    }
  };

  return (
    <div style={{ padding: spacing[4] }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing[6],
        }}
      >
        <Text size="xl" weight="bold" color="primary">
          {area || t("floorMap.wholeRestaurant")}
        </Text>
        <button
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ⚙️
        </button>
      </div>

      {/* Grid de Mesas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          gap: gap,
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        {tables.map((table) => {
          const statusColor = getStatusColor(table.status);
          const statusLabel =
            getStatusLabelKey(table.status) === "?"
              ? "?"
              : t(getStatusLabelKey(table.status));
          const isCalling = table.status === TableStatus.CALLING;

          return (
            <button
              key={table.id}
              onClick={() => handleTableClick(table)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleTableLongPress(table);
              }}
              style={{
                width: "100%",
                aspectRatio: "1",
                minHeight: tableSize,
                minWidth: tableSize,
                borderRadius: 12,
                border: `2px solid ${statusColor}`,
                background: isCalling
                  ? `linear-gradient(135deg, ${statusColor}22, ${statusColor}44)`
                  : `${statusColor}22`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
                // Animação piscante para "chamando"
                animation: isCalling
                  ? "pulse 1.5s ease-in-out infinite"
                  : "none",
              }}
              onMouseDown={(e) => {
                // Feedback tátil simulado (visual)
                e.currentTarget.style.transform = "scale(0.95)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {/* Número da Mesa */}
              <Text
                size="lg"
                weight="bold"
                style={{
                  color: statusColor,
                  marginBottom: spacing[1],
                }}
              >
                {t("floorMap.tableNumber", { number: table.number })}
              </Text>

              {/* Status */}
              <Text
                size="sm"
                style={{
                  color: statusColor,
                  opacity: 0.8,
                }}
              >
                {statusLabel}
              </Text>

              {/* Badge de chamados múltiplos */}
              {table.callCount && table.callCount >= 3 && (
                <div
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: "#ff453a",
                    color: "white",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  {table.callCount}
                </div>
              )}

              {/* Timer (se ocupada) */}
              {table.seatedAt && (
                <Text
                  size="xs"
                  style={{
                    color: colors.text.tertiary,
                    marginTop: spacing[1],
                  }}
                >
                  {t("floorMap.minutesAgo", {
                    minutes: Math.floor(
                      (Date.now() - table.seatedAt.getTime()) / 60000,
                    ),
                  })}
                </Text>
              )}
            </button>
          );
        })}
      </div>

      {/* CSS para animação piscante */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
