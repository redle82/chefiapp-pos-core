import { StrictMode, useCallback, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "../App";
import {
  LifecycleStateProvider,
  type LifecycleStateContextValue,
} from "../context/LifecycleStateContext";
import type { RestaurantLifecycleState } from "../core/lifecycle/LifecycleState";
import { ErrorBoundary } from "../ui/design-system/ErrorBoundary";

type RootContainer = HTMLElement & { __reactRoot?: Root };

function RootWithLifecycle() {
  const [lifecycleState, setLifecycleState] =
    useState<RestaurantLifecycleState | null>(null);
  const setter = useCallback((state: RestaurantLifecycleState | null) => {
    setLifecycleState(state);
  }, []);

  const lifecycleValue: LifecycleStateContextValue = {
    lifecycleState,
    setLifecycleState: setter,
  };

  return (
    <LifecycleStateProvider value={lifecycleValue}>
      <App />
    </LifecycleStateProvider>
  );
}

export function createDefaultAppElement(): ReactNode {
  return (
    <StrictMode>
      <ErrorBoundary context="Root">
        <BrowserRouter>
          <RootWithLifecycle />
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>
  );
}

export function renderRootApp(options: {
  container: RootContainer | null;
  createRootFn?: typeof createRoot;
  appElement?: ReactNode;
}): Root | null {
  const {
    container,
    createRootFn = createRoot,
    appElement = createDefaultAppElement(),
  } = options;

  if (!container) return null;

  const existingRoot = container.__reactRoot;
  const root = existingRoot ?? createRootFn(container);
  if (!existingRoot) container.__reactRoot = root;
  root.render(appElement);
  return root;
}

export function renderAppFromDom(options?: {
  documentObj?: Document | undefined;
}): Root | null {
  const documentObj = options?.documentObj ?? globalThis.document;
  return renderRootApp({
    container:
      (documentObj?.getElementById("root") as RootContainer | null) ?? null,
  });
}
