// hooks/useKitchenLoad.ts
import { useKitchenStore } from "../store/useKitchenStore";

export function useKitchenLoad() {
  const avgPrepTime = useKitchenStore((s) => s.avgPrepTime);
  let kitchenLoad: "green" | "yellow" | "red" = "green";
  if (avgPrepTime > 20) kitchenLoad = "red";
  else if (avgPrepTime > 12) kitchenLoad = "yellow";
  return kitchenLoad;
}
