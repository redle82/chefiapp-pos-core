import React from "react";
export interface Operator {
  id: string;
  name: string;
}
export const TPVLockScreen = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
