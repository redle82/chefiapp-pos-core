/**
 * OrderTypeTabs — Take Away | Dine In | Delivery segmented control
 *
 * When Dine In is selected and a table is set, shows "Mesa X ✓" indicator
 */

import type { OrderMode } from "../../../pages/TPVMinimal/components/OrderModeSelector";
import type { SelectedTable } from "../hooks/useMobileCart";

interface OrderTypeTabsProps {
  activeMode: OrderMode;
  onModeChange: (mode: OrderMode) => void;
  selectedTable?: SelectedTable | null;
  onTableClick?: () => void;
}

const TABS: Array<{ mode: OrderMode; label: string; icon: string }> = [
  { mode: "take_away", label: "Take Away", icon: "🛍️" },
  { mode: "dine_in", label: "Dine In", icon: "🍽️" },
  { mode: "delivery", label: "Delivery", icon: "🚗" },
];

export function OrderTypeTabs({
  activeMode,
  onModeChange,
  selectedTable,
  onTableClick,
}: OrderTypeTabsProps) {
  return (
    <div className="pvm-tabs-container">
      <div className="pvm-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.mode}
            className={`pvm-tabs__item ${
              activeMode === tab.mode ? "pvm-tabs__item--active" : ""
            }`}
            onClick={() => onModeChange(tab.mode)}
          >
            <span className="pvm-tabs__icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Selected Table Indicator */}
      {activeMode === "dine_in" && selectedTable && (
        <button className="pvm-table-indicator" onClick={onTableClick}>
          <span className="pvm-table-indicator__badge">
            Mesa {selectedTable.number} ✓
          </span>
          <span className="pvm-table-indicator__change">Alterar</span>
        </button>
      )}
    </div>
  );
}
