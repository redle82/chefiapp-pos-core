import { beforeEach, describe, expect, it, vi } from "vitest";

const mockIsElectron = vi.fn();

vi.mock("../operational/platformDetection", () => ({
  isElectron: () => mockIsElectron(),
}));

import { getDesktopPrinters } from "./DesktopPrintAgentApi";

describe("DesktopPrintAgentApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as Window & { electronBridge?: unknown }).electronBridge;
  });

  it("returns DESKTOP_APP_REQUIRED when not in electron", async () => {
    mockIsElectron.mockReturnValue(false);

    const result = await getDesktopPrinters();

    expect(result.data).toEqual([]);
    expect(result.error?.message).toBe("DESKTOP_APP_REQUIRED");
  });

  it("returns printer list from bridge", async () => {
    mockIsElectron.mockReturnValue(true);

    (
      window as Window & {
        electronBridge?: {
          getPrinters: () => Promise<
            Array<{ name: string; isDefault: boolean; status: string }>
          >;
        };
      }
    ).electronBridge = {
      getPrinters: vi
        .fn()
        .mockResolvedValue([
          { name: "EPSON_TM_M30II", isDefault: true, status: "online" },
        ]),
    };

    const result = await getDesktopPrinters();

    expect(result.error).toBeNull();
    expect(result.data).toEqual([
      { name: "EPSON_TM_M30II", isDefault: true, status: "online" },
    ]);
  });
});
