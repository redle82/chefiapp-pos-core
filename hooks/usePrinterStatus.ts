// hooks/usePrinterStatus.ts
import { useState } from "react";

// Mock: In real app, this would poll printer status from backend or hardware
export function usePrinterStatus() {
  // 'online', 'offline', 'error'
  const [status] = useState<"online" | "offline" | "error">("online");
  return status;
}
