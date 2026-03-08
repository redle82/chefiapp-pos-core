import { describe, expect, it, vi } from "vitest";
import {
  exposeInsforgeValidationDevHelper,
  probeOptionalCoreTables,
} from "./backgroundTasks";

describe("backgroundTasks", () => {
  it("probes optional core tables and swallows failures", async () => {
    const probeOptionalTables = vi.fn().mockRejectedValue(new Error("offline"));

    await expect(
      probeOptionalCoreTables({
        loadProbeClient: async () => ({ probeOptionalTables }),
      }),
    ).resolves.toBeUndefined();

    expect(probeOptionalTables).toHaveBeenCalledTimes(1);
  });

  it("exposes validateInsforge only in dev mode", async () => {
    const info = { info: vi.fn() };
    const windowObj = {} as Window & typeof globalThis;
    const runValidation = vi.fn();

    await exposeInsforgeValidationDevHelper({
      isDev: true,
      windowObj,
      info,
      loadValidator: async () => ({ runValidation }),
    });

    expect(
      (windowObj as Window & { validateInsforge?: unknown }).validateInsforge,
    ).toBe(runValidation);
    expect(info.info).toHaveBeenCalledWith(
      "💡 InsForge validation available: Type 'validateInsforge()' in console",
    );
  });
});
