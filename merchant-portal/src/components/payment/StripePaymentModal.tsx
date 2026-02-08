import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import React, { useState } from "react";
import styles from "./StripePaymentModal.module.css";

import { CONFIG } from "../../config";

// Initialize Stripe outside component to avoid re-initializing
// Centralized config handles both VITE_STRIPE_PUBLIC_KEY and PUBLISHABLE_KEY
const STRIPE_KEY = CONFIG.STRIPE_PUBLIC_KEY || null;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

interface StripePaymentModalProps {
  clientSecret: string;
  total: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

const CheckoutForm: React.FC<{
  onSuccess: (id: string) => void;
  onCancel: () => void;
}> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href, // Not used for redirect-less flow, but required
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || "Erro ao processar pagamento");
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setError(
        "Estado inesperado: " + (paymentIntent?.status || "desconhecido"),
      );
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <PaymentElement />
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.actions}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelBtn}
          disabled={processing}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className={styles.payBtn}
        >
          {processing ? "Processando..." : "Pagar Agora"}
        </button>
      </div>
    </form>
  );
};

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  clientSecret,
  total,
  onSuccess,
  onCancel,
}) => {
  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
    },
  };

  if (!stripePromise) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.header}>
            <h2 className="text-red-500">Configuração Pendente</h2>
          </div>
          <div style={{ padding: "20px", textAlign: "center", color: "#ccc" }}>
            <p>A chave pública do Stripe (VITE_STRIPE_PK) não foi definida.</p>
            <p style={{ fontSize: "0.8em", marginTop: "10px" }}>
              Configure o arquivo .env para habilitar pagamentos.
            </p>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelBtn}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Finalizar Pagamento</h2>
          <p>Total: € {total.toFixed(2)}</p>
        </div>
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
        </Elements>
      </div>
    </div>
  );
};
