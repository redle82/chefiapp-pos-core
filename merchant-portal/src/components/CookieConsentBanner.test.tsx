/**
 * Teste: CookieConsentBanner (Plano "Melhorias uma a uma" — Passo 1).
 * Garante que o banner existe, mostra links para termos/privacidade e botão Aceitar.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "../i18n";
import { CookieConsentBanner } from "./CookieConsentBanner";

const mockRecordLegalConsent = vi.fn();
const mockGetTabIsolated = vi.fn();

vi.mock("../core/audit/legalConsent", () => ({
  recordLegalConsent: (payload: unknown) => mockRecordLegalConsent(payload),
}));

vi.mock("../core/storage/TabIsolatedStorage", () => ({
  getTabIsolated: (key: string) => mockGetTabIsolated(key),
}));

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  it("renderiza o banner com links para Termos e Política de Privacidade quando não há consentimento", () => {
    mockGetTabIsolated.mockReturnValue(null);

    render(
      <MemoryRouter>
        <CookieConsentBanner />
      </MemoryRouter>,
    );

    const dialog = screen.getByRole("dialog", {
      name: /aviso de cookies e termos|cookie and terms notice/i,
    });
    expect(dialog).toBeTruthy();

    const termsLink = screen.getByRole("link", {
      name: /termos de uso|terms of use/i,
    });
    expect(termsLink.getAttribute("href")).toBe("/legal/terms");

    const privacyLink = screen.getByRole("link", {
      name: /pol[ií]tica de privacidade|privacy policy/i,
    });
    expect(privacyLink.getAttribute("href")).toBe("/legal/privacy");

    const acceptBtn = screen.getByRole("button", { name: /aceitar|accept/i });
    expect(acceptBtn).toBeTruthy();
  });

  it("ao clicar em Aceitar, regista consentimento e esconde o banner", async () => {
    mockGetTabIsolated.mockReturnValue(null);
    mockRecordLegalConsent.mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CookieConsentBanner />
      </MemoryRouter>,
    );

    const acceptBtn = screen.getByRole("button", { name: /aceitar|accept/i });
    await user.click(acceptBtn);

    expect(mockRecordLegalConsent).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "cookie_banner",
        termsUrl: "/legal/terms",
        privacyUrl: "/legal/privacy",
      }),
    );
    expect(
      window.localStorage.getItem("chefiapp_cookie_consent_accepted"),
    ).toBe("true");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
