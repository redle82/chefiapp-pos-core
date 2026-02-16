import React from "react";
export interface Operator {
  id: string;
  name: string;
  role?: string;
}
interface TPVLockScreenProps {
  children: React.ReactNode;
  onUnlock?: (
    operator: Operator,
    mode: "command" | "rush" | "training",
  ) => void | Promise<void>;
}

export const TPVLockScreen = ({ children }: TPVLockScreenProps) => (
  <>{children}</>
);
