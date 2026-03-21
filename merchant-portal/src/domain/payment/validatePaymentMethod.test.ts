import { describe, expect, it } from "vitest";
import {
  canConfirmPayment,
  isPaymentTerminal,
  requiresExternalRedirect,
  requiresQRCode,
  requiresStripe,
  shouldShowConfirmButton,
  validateMBWayPhone,
} from "./validatePaymentMethod";

describe("validatePaymentMethod", () => {
  it("validates MBWay phone format", () => {
    expect(validateMBWayPhone("912345678")).toBe(true);
    expect(validateMBWayPhone("812345678")).toBe(false);
  });

  it("blocks confirmation on intermediate statuses", () => {
    expect(
      canConfirmPayment("pix", 0, 0, "", false, "creating", "idle", false),
    ).toBe(false);
    expect(
      canConfirmPayment(
        "sumup_eur",
        0,
        0,
        "",
        false,
        "idle",
        "redirect",
        false,
      ),
    ).toBe(false);
  });

  it("allows confirmation for sumup failed retry", () => {
    expect(
      canConfirmPayment("sumup_eur", 0, 0, "", false, "idle", "failed", false),
    ).toBe(true);
  });

  it("falls back to true for unsupported provider value", () => {
    const unsupportedMethod = "unsupported_provider" as unknown as
      | "cash"
      | "card"
      | "mbway"
      | "pix"
      | "sumup_eur"
      | "loyalty";

    expect(
      canConfirmPayment(
        unsupportedMethod,
        0,
        0,
        "",
        false,
        "idle",
        "idle",
        false,
      ),
    ).toBe(true);
  });

  it("evaluates terminal state and CTA visibility branches", () => {
    expect(isPaymentTerminal("polling", "idle", "idle")).toBe(false);
    expect(isPaymentTerminal("completed", "idle", "idle")).toBe(true);

    expect(requiresStripe("card")).toBe(true);
    expect(requiresQRCode("pix")).toBe(true);
    expect(requiresExternalRedirect("sumup_eur")).toBe(true);

    expect(shouldShowConfirmButton("card", "ready", false)).toBe(false);
    expect(shouldShowConfirmButton("cash", "idle", false)).toBe(true);
  });
});
