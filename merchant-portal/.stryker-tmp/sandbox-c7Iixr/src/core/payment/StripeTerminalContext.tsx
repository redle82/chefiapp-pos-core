import { Elements } from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { CONFIG } from "../../config";
import { currencyService } from "../currency/CurrencyService";
import { getStripePromise } from "./loadStripeLazy";
import { PaymentBroker } from "./PaymentBroker";

const STRIPE_KEY = CONFIG.STRIPE_PUBLIC_KEY || null;

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
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);

  useEffect(() => {
    getStripePromise(STRIPE_KEY).then(setStripeInstance);
  }, []);

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
        currency: currencyService.getDefaultCurrency().toLowerCase(),
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
        isReady: !!stripeInstance,
        initializePayment,
        clientSecret,
        clearSession,
      }}
    >
      {clientSecret && stripeInstance ? (
        <Elements
          stripe={Promise.resolve(stripeInstance)}
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
