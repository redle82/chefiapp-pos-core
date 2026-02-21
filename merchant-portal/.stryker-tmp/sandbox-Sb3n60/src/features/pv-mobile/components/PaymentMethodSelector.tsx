/**
 * PaymentMethodSelector — Payment method chip selector for checkout
 *
 * Phase 6: Horizontal scrollable payment options (cash, card, pix, mbway)
 * - Thumb-optimized 56px+ chips
 * - Visual feedback for selection
 * - Smooth scroll on mobile
 */

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export type PaymentMethod = "cash" | "card" | "pix" | "mbway" | "check";

interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  emoji: string;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: "cash", label: "Dinheiro", emoji: "💵" },
  { id: "card", label: "Cartão", emoji: "💳" },
  { id: "pix", label: "Pix", emoji: "🔄" },
  { id: "mbway", label: "MB Way", emoji: "📱" },
  { id: "check", label: "Cheque", emoji: "✓" },
];

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
}: PaymentMethodSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected method (smooth behavior)
  useEffect(() => {
    if (!selectedMethod || !scrollContainerRef.current) return;

    const selectedButton = scrollContainerRef.current.querySelector(
      `[data-method="${selectedMethod}"]`,
    ) as HTMLElement;

    if (selectedButton) {
      selectedButton.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedMethod]);

  return (
    <div className="pvm-payment-selector">
      <p className="pvm-payment-selector__label">Método de Pagamento</p>

      <div className="pvm-payment-selector__scroll" ref={scrollContainerRef}>
        <div className="pvm-payment-selector__container">
          {PAYMENT_METHODS.map((method) => (
            <motion.button
              key={method.id}
              className={`pvm-payment-chip ${
                selectedMethod === method.id ? "pvm-payment-chip--selected" : ""
              }`}
              data-method={method.id}
              onClick={() => onSelectMethod(method.id)}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              aria-pressed={selectedMethod === method.id}
              aria-label={method.label}
            >
              <span className="pvm-payment-chip__emoji">{method.emoji}</span>
              <span className="pvm-payment-chip__label">{method.label}</span>
              {selectedMethod === method.id && (
                <motion.div
                  className="pvm-payment-chip__checkmark"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  ✓
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
