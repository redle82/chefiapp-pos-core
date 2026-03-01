import {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";
import type { LaunchContext } from "./LaunchContext";

const LaunchContextReact = createContext<LaunchContext | null>(null);

export function LaunchContextProvider({
  value,
  children,
}: PropsWithChildren<{ value: LaunchContext | null }>) {
  return (
    <LaunchContextReact.Provider value={value}>
      {children}
    </LaunchContextReact.Provider>
  );
}

export function useLaunchContext(): LaunchContext | null {
  return useContext(LaunchContextReact);
}
