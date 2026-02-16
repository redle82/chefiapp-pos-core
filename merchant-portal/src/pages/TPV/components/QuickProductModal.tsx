interface QuickProductModalProps {
  onClose: () => void;
  onCreate: (name: string, price: number) => void | Promise<void>;
}

export const QuickProductModal = (_props: QuickProductModalProps) => null;
