// @ts-nocheck
import React from "react";
import { ServiceWorkerManager } from "./ServiceWorkerManager";
import { useShiftLock } from "./useShiftLock";

export const ShiftGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Enforce Shift Lock (Global Side Effect)
  useShiftLock();

  return (
    <>
      <ServiceWorkerManager />
      {children}
    </>
  );
};
