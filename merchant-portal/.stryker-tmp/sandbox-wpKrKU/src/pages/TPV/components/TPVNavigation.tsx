import React from "react";
import { Button } from "../../../ui/design-system/Button";

type TPVView =
  | "menu"
  | "tables"
  | "orders"
  | "reservations"
  | "delivery"
  | "warmap";

interface TPVNavigationProps {
  currentView: TPVView;
  onChangeView: (view: TPVView) => void;
  onSettings: () => void;
  cashStatus: string;
}

const navItems: Array<{ id: TPVView; label: string }> = [
  { id: "menu", label: "Menu" },
  { id: "tables", label: "Mesas" },
  { id: "orders", label: "Pedidos" },
  { id: "reservations", label: "Reservas" },
  { id: "delivery", label: "Delivery" },
  { id: "warmap", label: "War Map" },
];

export const TPVNavigation: React.FC<TPVNavigationProps> = ({
  currentView,
  onChangeView,
  onSettings,
  cashStatus,
}) => {
  return (
    <div className="flex flex-col gap-3 p-3 bg-zinc-900/60 backdrop-blur-sm border-b border-white/5">
      <div className="flex gap-2 flex-wrap">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={currentView === item.id ? "primary" : "secondary"}
            size="sm"
            className={`rounded-full px-4 font-medium transition-all ${
              currentView === item.id
                ? "shadow-lg shadow-primary/20"
                : "opacity-70 hover:opacity-100 bg-zinc-800 border-transparent text-zinc-300"
            }`}
            onClick={() => onChangeView(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Caixa: {cashStatus}</span>
        <button
          onClick={onSettings}
          className="text-zinc-300 hover:text-white"
          type="button"
        >
          Definicoes
        </button>
      </div>
    </div>
  );
};
