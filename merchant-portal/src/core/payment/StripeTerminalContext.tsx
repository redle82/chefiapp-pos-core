import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import React, { createContext, ReactNode, useContext, useState } from "react";
import { CONFIG } from "../../config";
import { PaymentBroker } from "./PaymentBroker";

// Initialize Stripe Promise (Singleton) — uses centralized config
const STRIPE_KEY = CONFIG.STRIPE_PUBLIC_KEY || "";
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

interface StripeTerminalContextType {
  isReady: boolean;
  initializePayment: (params: {
    orderId: string;
    amount: number;
    restaurantId: string;
    operatorId?: string;
    cashRegisterId?: string;
  }) => Promise<string | null>;
  clientSecret: string | null;
  clearSession: () => void;
}

const StripeTerminalContext = createContext<
  StripeTerminalContextType | undefined
>(undefined);

export const StripeTerminalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const initializePayment = async (params: {
    orderId: string;
    amount: number;
    restaurantId: string;
    operatorId?: string;
    cashRegisterId?: string;
  }) => {
    try {
      const result = await PaymentBroker.createPaymentIntent({
        orderId: params.orderId,
        amount: params.amount,
        currency: "eur", // TODO: Make dynamic based on restaurant currency
        restaurantId: params.restaurantId,
        operatorId: params.operatorId,
        cashRegisterId: params.cashRegisterId,
      });
      setClientSecret(result.clientSecret);
      return result.clientSecret;
    } catch (error) {
      console.error("[StripeTerminal] Initialization Failed:", error);
      return null;
    }
  };

  const clearSession = () => {
    setClientSecret(null);
  };

  return (
    <StripeTerminalContext.Provider
      value={{
        isReady: !!stripePromise,
        initializePayment,
        clientSecret,
        clearSession,
      }}
    >
      {clientSecret && stripePromise ? (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance: { theme: "stripe" } }}
        >
          {children}
        </Elements>
      ) : (
        children
      )}
    </StripeTerminalContext.Provider>
  );
};

export const useStripeTerminal = () => {
  const context = useContext(StripeTerminalContext);
  if (!context) {
    throw new Error(
      "useStripeTerminal must be used within a StripeTerminalProvider",
    );
  }
  return context;
};
