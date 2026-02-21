interface CashRegisterAlertProps {
  isOpen: boolean;
  onOpenCash: () => void;
}

export const CashRegisterAlert = (_props: CashRegisterAlertProps) => (
  <div className="hidden">CashRegisterAlert</div>
);
