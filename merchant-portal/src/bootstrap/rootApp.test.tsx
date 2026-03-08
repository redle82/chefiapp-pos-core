/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("../App", () => ({
  default: () => <div>mock-app</div>,
}));

vi.mock("../ui/design-system/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: unknown }) => children,
}));

describe("rootApp", () => {
  it("creates the root once and reuses cached __reactRoot on subsequent renders", async () => {
    const { renderRootApp } = await import("./rootApp");
    const render = vi.fn();
    const createRoot = vi.fn(() => ({ render }));
    const container = document.createElement("div") as HTMLDivElement & {
      __reactRoot?: { render: typeof render };
    };

    renderRootApp({
      container,
      createRootFn: createRoot,
      appElement: <div>test</div>,
    });
    renderRootApp({
      container,
      createRootFn: createRoot,
      appElement: <div>test-2</div>,
    });

    expect(createRoot).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(2);
    expect(container.__reactRoot).toBeDefined();
  });
});
