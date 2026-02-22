import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { BillingSuccessPage } from "./BillingSuccessPage";

describe("BillingSuccessPage", () => {
  it("renders with design system card and buttons", () => {
    const { container } = render(
      <MemoryRouter>
        <BillingSuccessPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /Assinatura ativa/i }),
    ).toBeTruthy();

    const card = container.querySelector(".card");
    expect(card).toBeTruthy();

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(2);
    buttons.forEach((button) => {
      expect(button.className).toContain("button");
    });
  });
});
