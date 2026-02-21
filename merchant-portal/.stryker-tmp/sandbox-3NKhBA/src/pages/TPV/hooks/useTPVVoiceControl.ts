// @ts-nocheck
interface UseTPVVoiceControlParams {
  tables: Array<{ id: string; number: number }>;
  orders: Array<{ id: string; status: string }>; // minimal shape
  onSelectTable: (tableId: string) => void;
  onSwitchView: (
    view: "menu" | "tables" | "orders" | "reservations" | "delivery" | "warmap",
  ) => void;
  onCloseCash: () => void;
  onOpenPayment: () => void;
}

export const useTPVVoiceControl = (_params: UseTPVVoiceControlParams) => ({
  isListening: false,
  isAvailable: false,
  startListening: () => {},
  stopListening: () => {},
});
