/**
 * Teste: OfflineIndicator (Plano "Melhorias uma a uma" — Passo 2).
 * Garante que a barra de modo offline existe e mostra a mensagem quando Core está DOWN.
 */

import { render, screen } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import { OfflineIndicator } from "./OfflineIndicator";

const mockUseConnectivity = vi.fn();

vi.mock("../core/sync/useConnectivity", () => ({
  useConnectivity: () => mockUseConnectivity(),
}));

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe("OfflineIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConnectivity.mockReturnValue("online");
  });

  it("não renderiza nada quando rede online e Core UP", () => {
    const { container } = renderWithI18n(<OfflineIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it("mostra a barra 'Modo offline' quando Core está DOWN", () => {
    mockUseConnectivity.mockReturnValue("offline");

    renderWithI18n(<OfflineIndicator />);

    const status = screen.getByRole("status");
    expect(status).toBeTruthy();
    expect(
      screen.getByText(
        /modo offline — as alterações serão sincronizadas|offline mode — changes will sync/i,
      ),
    ).toBeTruthy();
  });
});
