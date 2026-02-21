/**
 * Teste: DataPrivacyPage (Plano "Melhorias uma a uma" — Passo 4).
 * Garante que a página de dados e privacidade existe, com botões de exportar e eliminar e modais.
 */
// @ts-nocheck


import "../../i18n";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataPrivacyPage } from "./DataPrivacyPage";

describe("DataPrivacyPage", () => {
  it("renderiza o título e os botões de exportar e eliminar", () => {
    render(<DataPrivacyPage />);

    expect(
      screen.getByRole("heading", { name: /dados e privacidade/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /exportar os meus dados/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /eliminar conta \/ dados/i }),
    ).toBeTruthy();
  });

  it("ao clicar em Exportar, abre o modal de exportação", async () => {
    const user = userEvent.setup();
    render(<DataPrivacyPage />);

    await user.click(
      screen.getByRole("button", { name: /exportar os meus dados/i }),
    );

    expect(
      screen.getByRole("dialog", { name: /exportar os meus dados/i }),
    ).toBeTruthy();
    expect(screen.getByText(/será enviado um pacote com os dados/i)).toBeTruthy();
  });

  it("ao clicar em Eliminar conta, abre o modal de eliminação", async () => {
    const user = userEvent.setup();
    render(<DataPrivacyPage />);

    await user.click(
      screen.getByRole("button", { name: /eliminar conta \/ dados/i }),
    );

    expect(
      screen.getByRole("dialog", { name: /eliminar conta \/ dados/i }),
    ).toBeTruthy();
    expect(
      screen.getByText(/após confirmação e verificação de identidade/i),
    ).toBeTruthy();
  });
});
