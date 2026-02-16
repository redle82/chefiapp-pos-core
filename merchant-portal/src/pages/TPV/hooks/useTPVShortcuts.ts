interface TPVShortcutHandlers {
  onCreateOrder: () => void;
  onCloseOrder: () => void;
  onSearchTable: () => void;
  onOpenCash: () => void;
  onCloseCash: () => void;
  onPayment: () => void;
  onCancel: () => void;
}

export const useCommonTPVShortcuts = (_handlers: TPVShortcutHandlers) => {};
