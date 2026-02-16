interface OpenCashRegisterModalProps {
  onOpen: (openingBalanceCents: number) => void | Promise<void>;
  onCancel: () => void;
}

export const OpenCashRegisterModal = (_props: OpenCashRegisterModalProps) =>
  null;
