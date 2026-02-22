import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HelpStartLocalPage } from "./HelpStartLocalPage";

describe("HelpStartLocalPage", () => {
  it("uses design system card and button", () => {
    const { container } = render(
      <MemoryRouter>
        <HelpStartLocalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /Como iniciar o servidor local/i }),
    ).toBeTruthy();

    const card = container.querySelector(".card");
    expect(card).toBeTruthy();

    const button = screen.getByRole("button", { name: /Voltar à landing/i });
    expect(button.className).toContain("button");
  });
});
