import { beforeEach, describe, expect, it, vi } from "vitest";

const mockInvokeRpc = vi.fn();

vi.mock("../infra/coreRpc", () => ({
  invokeRpc: (...args: unknown[]) => mockInvokeRpc(...args),
}));

import {
  createLabelJob,
  listLabelProfiles,
  saveLabelProfile,
  type LabelCodeMode,
  type LabelProfileInput,
  type LabelQrMode,
  type LabelScope,
  type LabelStorageType,
} from "./LabelEngineApi";

describe("LabelEngineApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists tenant label profiles", async () => {
    mockInvokeRpc.mockResolvedValueOnce({
      data: [{ id: "profile-1", name: "Default" }],
      error: null,
    });

    const result = await listLabelProfiles("rest-1");

    expect(mockInvokeRpc).toHaveBeenCalledWith("list_label_profiles", {
      p_restaurant_id: "rest-1",
    });
    expect(result.error).toBeNull();
    expect(result.data).toEqual([{ id: "profile-1", name: "Default" }]);
  });

  it("saves profile payload with expected rpc fields", async () => {
    const profileInput: LabelProfileInput = {
      name: "CA + ES 60x40",
      printerTarget: "MUNBYN_LABEL_1",
      size: { widthMm: 60, heightMm: 40 },
      templateId: "short-60x40",
      languagePrimary: "ca",
      languageSecondary: "es",
      barcode: "code128" satisfies LabelCodeMode,
      qr: "batch" satisfies LabelQrMode,
      defaultScope: "product" satisfies LabelScope,
      productId: "sku-1",
      operatorId: null,
    };

    mockInvokeRpc.mockResolvedValueOnce({
      data: { id: "profile-1" },
      error: null,
    });

    const result = await saveLabelProfile("rest-1", profileInput);

    expect(mockInvokeRpc).toHaveBeenCalledWith("upsert_label_profile", {
      p_restaurant_id: "rest-1",
      p_profile: profileInput,
    });
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ id: "profile-1" });
  });

  it("creates a label print job through request_print", async () => {
    mockInvokeRpc.mockResolvedValueOnce({
      data: { job_id: "job-1", status: "pending" },
      error: null,
    });

    const result = await createLabelJob({
      restaurantId: "rest-1",
      profileId: "profile-1",
      productId: "sku-1",
      storageType: "frozen" satisfies LabelStorageType,
      packageMode: "unit",
      quantity: 24,
      boxSize: null,
      lotCode: "L240302A",
      producedAt: "2026-03-02T10:00:00.000Z",
      expiresAt: "2026-09-02T10:00:00.000Z",
      netWeightGrams: 180,
      secondLanguageEnabled: true,
    });

    expect(mockInvokeRpc).toHaveBeenCalledWith("request_print", {
      p_restaurant_id: "rest-1",
      p_type: "label",
      p_order_id: null,
      p_payload: {
        profile_id: "profile-1",
        product_id: "sku-1",
        storage_type: "frozen",
        package_mode: "unit",
        quantity: 24,
        box_size: null,
        lot_code: "L240302A",
        produced_at: "2026-03-02T10:00:00.000Z",
        expires_at: "2026-09-02T10:00:00.000Z",
        net_weight_grams: 180,
        second_language_enabled: true,
      },
    });
    expect(result.error).toBeNull();
    expect(result.data?.job_id).toBe("job-1");
  });
});
