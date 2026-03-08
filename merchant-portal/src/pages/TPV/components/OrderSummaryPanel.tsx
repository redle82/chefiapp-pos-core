import React from "react";
import { useCurrency } from "../../../core/currency/useCurrency";
import { Button } from "../../../ui/design-system/Button";
import { Card } from "../../../ui/design-system/Card";
import { Text } from "../../../ui/design-system/primitives/Text";

interface OrderSummaryPanelProps {
  order: any;
  onSplitBill?: () => void;
  onPay?: () => void;
  /** FASE 1: quando presente, mostra "Confirmar pedido" em vez de Split/Pay. Ver FLUXO_DE_PEDIDO_OPERACIONAL.md */
  onConfirm?: () => void;
  loading?: boolean;
}

export const OrderSummaryPanel: React.FC<OrderSummaryPanelProps> = ({
  order,
  onSplitBill,
  onPay,
  onConfirm,
  loading,
}) => {
  const { symbol } = useCurrency();
  const items = order?.items || [];
  const total = order?.total ?? order?.total_amount ?? 0;

  if (loading)
    return <div className="p-4 text-center">Carregando resumo...</div>;

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {items?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-50 gap-2">
            <div className="text-4xl">🧾</div>
            <Text className="text-sm">Nenhum item adicionado</Text>
          </div>
        ) : (
          items.map((item: any, idx: number) => (
            <div
              key={idx}
              className="flex justify-between items-start py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors group"
            >
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                  {item.quantity}
                </div>
                <div>
                  <Text className="font-medium text-zinc-200">{item.name}</Text>
                  {item.notes && (
                    <Text className="text-xs text-amber-500/80 mt-0.5">
                      📝 {item.notes}
                    </Text>
                  )}
                  {item.category && item.category !== "Uncategorized" && (
                    <Text className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">
                      {item.category}
                    </Text>
                  )}
                </div>
              </div>
              <Text className="font-mono text-zinc-300">
                {((item.unit_price * item.quantity) / 100).toFixed(2)}
              </Text>
            </div>
          ))
        )}
      </div>

      <Card className="mb-3 p-4 border-b border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-10">
        <div className="flex justify-between mb-4 items-end">
          <Text className="text-zinc-500 text-sm font-medium uppercase tracking-widest">
            Total
          </Text>
          <Text className="text-3xl text-primary font-bold tracking-tight">
            {(total / 100).toFixed(2)}
            <span className="text-lg text-zinc-500 ml-1 font-normal">
              {symbol}
            </span>
          </Text>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {onConfirm ? (
            <Button
              variant="primary"
              onClick={onConfirm}
              className="col-span-3 h-14 text-xl font-bold bg-primary hover:bg-primary/90 text-black shadow-lg shadow-primary/20"
            >
              Confirmar pedido
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={onSplitBill}
                className="h-14 text-sm font-bold bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
              >
                ✂️ Dividir
              </Button>
              <Button
                variant="primary"
                onClick={onPay}
                className="col-span-2 h-14 text-xl font-bold bg-primary hover:bg-primary/90 text-black shadow-lg shadow-primary/20"
              >
                Pagamento
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
