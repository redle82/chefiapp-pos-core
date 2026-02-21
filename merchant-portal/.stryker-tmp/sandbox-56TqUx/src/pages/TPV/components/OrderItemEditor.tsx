// @ts-nocheck
import React from "react";
import { Button } from "../../../ui/design-system/Button";
import { Card } from "../../../ui/design-system/Card";
import { Text } from "../../../ui/design-system/primitives/Text";

interface OrderItemEditorProps {
  order: any;
  onUpdateQuantity: (itemId: string, quantity: number) => void | Promise<void>;
  onRemoveItem: (itemId: string) => void | Promise<void>;
  onBackToMenu?: () => void;
  loading?: boolean;
}

export const OrderItemEditor: React.FC<OrderItemEditorProps> = ({
  order,
  onUpdateQuantity,
  onRemoveItem,
  loading,
}) => {
  if (loading)
    return <div className="p-8 text-center text-zinc-500">Aguarde...</div>;
  if (!order)
    return (
      <div className="p-8 text-center text-zinc-500">Selecione um pedido</div>
    );

  const items = order.items || [];

  return (
    <div className="flex flex-col gap-2 h-full">
      <Text weight="bold" className="text-white px-2 mb-2">
        Editor de Itens
      </Text>
      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
        {items.map((item: any) => (
          <Card
            key={item.id}
            className="p-3 bg-zinc-900/50 border-white/5 group"
          >
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <Text weight="medium" className="text-zinc-200">
                  {item.name}
                </Text>
                <Text size="xs" className="text-zinc-500">
                  Un: {((item.price ?? item.unit_price) / 100).toFixed(2)}€
                </Text>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-zinc-800 rounded-lg overflow-hidden border border-white/10">
                  <button
                    onClick={() =>
                      onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))
                    }
                    className="w-8 h-8 flex items-center justify-center hover:bg-zinc-700 text-zinc-400"
                  >
                    -
                  </button>
                  <div className="w-8 text-center text-sm font-bold text-white">
                    {item.quantity}
                  </div>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-zinc-700 text-zinc-400"
                  >
                    +
                  </button>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
                >
                  🗑️
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
