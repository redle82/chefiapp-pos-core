import React from "react";
import { Card } from "../../../ui/design-system/Card";
import { Text } from "../../../ui/design-system/primitives/Text";

interface OrderHeaderProps {
  order: any;
  tableName?: string;
  customerName?: string;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({
  order,
  tableName,
  customerName,
}) => {
  const statusColors: Record<string, string> = {
    new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    preparing: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    ready: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    delivered: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    paid: "bg-primary/20 text-primary border-primary/30",
  };

  const status = order?.status || "new";
  const badgeClass =
    statusColors[status] || "bg-zinc-800 text-zinc-400 border-zinc-700";

  return (
    <Card className="mb-3 p-4 border-b border-white/5 bg-zinc-900/40 backdrop-blur-md">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-sm">
              {tableName ? tableName.substring(0, 3).toUpperCase() : "CTR"}
            </div>
            <Text
              as="h3"
              size="lg"
              weight="bold"
              className="text-white tracking-tight"
            >
              {tableName || "Walk-in Counter"}
            </Text>
          </div>
          {customerName && (
            <Text size="sm" className="text-zinc-400 ml-10">
              👤 {customerName}
            </Text>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <div
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}
          >
            {status}
          </div>
          <Text size="xs" className="text-zinc-600 font-mono text-[10px]">
            ID: {order?.id?.substring(0, 8).toUpperCase() || "NEW"}
          </Text>
        </div>
      </div>
    </Card>
  );
};
