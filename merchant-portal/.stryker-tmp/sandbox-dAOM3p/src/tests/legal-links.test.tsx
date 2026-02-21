// @ts-nocheck
import "../i18n";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { GlobalFooter } from "../components/GlobalFooter";
import { Footer } from "../pages/Landing/components/Footer";
import { LegalPrivacyPage } from "../pages/Legal/LegalPrivacyPage";
import { LegalTermsPage } from "../pages/Legal/LegalTermsPage";

describe("Legal links", () => {
  it("Landing footer links to legal pages", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    const termsLink = screen.getByRole("link", { name: /Termos/i });
    const privacyLink = screen.getByRole("link", { name: /Privacidade/i });

    expect(termsLink.getAttribute("href")).toBe("/legal/terms");
    expect(privacyLink.getAttribute("href")).toBe("/legal/privacy");
  });

  it("Global footer links to legal pages", () => {
    render(
      <MemoryRouter>
        <GlobalFooter />
      </MemoryRouter>,
    );

    const termsLink = screen.getByRole("link", { name: /Termos/i });
    const privacyLink = screen.getByRole("link", { name: /Privacidade/i });

    expect(termsLink.getAttribute("href")).toBe("/legal/terms");
    expect(privacyLink.getAttribute("href")).toBe("/legal/privacy");
  });
});

describe("Legal pages", () => {
  it("renders Terms page heading", () => {
    render(
      <MemoryRouter>
        <LegalTermsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /Termos de Uso/i }),
    ).toBeTruthy();
  });

  it("renders Privacy page heading", () => {
    render(
      <MemoryRouter>
        <LegalPrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /Pol[ií]tica de Privacidade/i }),
    ).toBeTruthy();
  });
});
